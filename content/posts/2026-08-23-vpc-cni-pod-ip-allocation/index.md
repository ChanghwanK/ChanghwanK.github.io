---
title: "Pod는 어떻게 VPC IP를 받는가"
description: "Pod 생성 순간 VPC CNI가 IP를 할당하는 경로를 kubelet, CRI, aws-cni 플러그인, ipamd, EC2 API 순서로 따라가며 warm pool 구조와 실패 지점을 정리합니다."
date: 2026-08-23
status: writing
tags:
  - Kubernetes
  - AWS
  - EKS
  - Networking
---

<aside>

_Pod가 IP를 받는 그 순간에는 EC2 API를 호출하지 않습니다. ipamd가 미리 확보해 둔 warm pool에서 하나를 꺼내 줄 뿐입니다. 이 비동기 구조가 EKS의 Pod 시작 지연도, IP 고갈 장애도, 조용히 멈추는 배포도 전부 설명합니다._

</aside>

## 왜 이 경로를 파고들게 되었는가

Pod가 `ContainerCreating`에서 멈춰 있는 상황을 만난 적이 있습니다. 노드에는 CPU도 메모리도 남아 있었고, 이미지 pull도 끝나 있었으며, 이벤트에는 이렇다 할 에러가 없었습니다. `kubectl describe node`를 봐도 노드는 `Ready`였습니다.

원인은 IP였습니다. kubelet은 자신이 받아들일 수 있는 Pod 수를 하나의 숫자로 알고 있었고, CNI가 실제로 공급할 수 있는 IP 개수는 그보다 적었습니다. 두 숫자가 어긋난 구간에 들어온 Pod는 스케줄링에는 성공하고 네트워크 설정에서 무한히 대기했습니다.

이 경험 이후 다음 질문에 답할 수 없다는 것이 불편해졌습니다.

- Pod에 IP를 실제로 붙이는 주체는 kubelet일까요, containerd일까요, 아니면 별도의 데몬일까요?
- IP는 Pod가 만들어지는 순간에 EC2에서 가져올까요, 아니면 그전에 미리 확보되어 있을까요?
- 노드 하나에 들어갈 수 있는 Pod 수는 누가, 언제, 무엇을 근거로 정할까요?
- Pod가 사라지면 그 IP는 즉시 다음 Pod에게 재사용될까요?
- 이 경로에서 실패할 수 있는 지점은 몇 개이고, 각각 어떤 증상으로 나타날까요?

이 글에서는 AWS VPC CNI가 Pod에 IP를 할당하는 과정을 스케줄링, CRI 호출, ipamd 통신, 네임스페이스 조립, warm pool 유지, 반환 순서로 따라갑니다. 마지막에는 이 경로의 실패 지점을 지도로 정리합니다.

## 큰 그림: 두 개의 축이 따로 돈다

VPC CNI를 이해하기 어려운 이유는 하나의 흐름처럼 보이는 동작이 실제로는 **서로 다른 주기로 도는 두 개의 축**이기 때문입니다.

```
[요청 축] Pod 생성 시점에 동기적으로 실행된다

kube-scheduler -> kubelet -> containerd -> aws-cni 바이너리 -> ipamd
                                                                 |
                                                    warm pool에서 IP 하나 꺼내 반환
                                                                 |
                                              veth 생성, 라우팅 규칙 설치, 완료

[배경 축] ipamd가 독립적으로 계속 돈다

ipamd 조정 루프
  현재 여유 IP < 목표치 인가?
      |
      +-- 예 -> EC2 API 호출 (ENI attach 또는 IP/prefix 할당)
      |
      +-- 아니오 -> 아무것도 하지 않음
```

_요청 축은 로컬 gRPC 호출과 네임스페이스 조작만 하므로 밀리초 단위이고, 배경 축은 EC2 컨트롤 플레인을 건드리므로 초 단위입니다._

Pod 시작이 빠른 이유도, 특정 순간에만 갑자기 느려지는 이유도 여기서 나옵니다. warm pool이 충분하면 요청 축만 돌고 끝나지만, 비어 있으면 요청 축이 배경 축의 EC2 API 응답을 기다려야 합니다.

## Step 1. IP 문제는 스케줄링에서 이미 시작된다

Pod가 노드에 배치되는 순간, 그 노드가 IP를 줄 수 있는지는 아무도 확인하지 않습니다. kube-scheduler가 보는 것은 노드 오브젝트에 적힌 `allocatable.pods` 숫자뿐입니다.

```bash
kubectl get node <node> -o jsonpath='{.status.allocatable.pods}'
```

이 값은 kubelet이 부팅 시점에 `--max-pods`로 받아 그대로 광고한 숫자입니다. kubelet은 CNI에게 "지금 IP 몇 개 남았어?"라고 물어보지 않습니다. 즉 이 숫자는 **실측이 아니라 선언**입니다.

EKS에서 이 숫자는 보통 인스턴스 타입의 ENI 한도로부터 계산됩니다.

```
maxPods = (ENI 개수 x (ENI당 IP 수 - 1)) + 2
```

`-1`은 ENI의 primary IP를 제외하기 위한 것입니다. 이 IP는 ENI 자신의 주소이므로 Pod에게 줄 수 없습니다. `+2`는 호스트 네트워크를 쓰는 `aws-node`와 `kube-proxy` 몫입니다. 이 둘은 노드의 네트워크 네임스페이스를 그대로 쓰므로 IP를 소비하지 않으면서 Pod로는 카운트되기 때문입니다.

prefix delegation 모드를 켜면 ENI의 각 슬롯에 IP 하나가 아니라 `/28` 접두사(16개)가 들어갑니다.

```
maxPods = (ENI 개수 x ((ENI당 IP 수 - 1) x 16)) + 2   // 실무에서는 110으로 상한
```

여기서 첫 번째 실패 조건이 만들어집니다. _kubelet이 광고한 `maxPods`와 CNI가 실제로 공급 가능한 IP 수는 서로 다른 경로로 결정되며, 아무도 둘을 대조하지 않습니다._ 광고 값이 더 크면 그 차이만큼의 Pod는 스케줄링에 성공한 뒤 IP를 못 받고 멈춥니다. 노드는 `Ready`이고, Pod 이벤트에는 명확한 원인이 남지 않습니다.

## Step 2. kubelet은 IP를 직접 다루지 않는다

Pod가 노드에 배정되면 kubelet은 컨테이너를 바로 만들지 않습니다. 먼저 **sandbox**를 만듭니다.

```
kubelet
  -> CRI RunPodSandbox (containerd)
       -> pause 컨테이너 생성
       -> 새 network namespace 생성 (/var/run/netns/cni-xxxx)
       -> CNI 플러그인 호출
```

sandbox는 Pod의 껍데기입니다. 안에서 도는 애플리케이션 컨테이너들이 공유할 네트워크 네임스페이스를 먼저 만들어 두고, 그 네임스페이스를 CNI에게 넘겨 "여기에 네트워크를 붙여 달라"고 요청하는 구조입니다. 애플리케이션 컨테이너가 재시작해도 IP가 유지되는 이유가 이것입니다. 네임스페이스의 수명은 sandbox에 묶여 있기 때문입니다.

containerd는 어떤 플러그인을 부를지 디스크의 설정 파일에서 읽습니다.

```bash
cat /etc/cni/net.d/10-aws.conflist
```

```json
{
  "cniVersion": "0.4.0",
  "name": "aws-cni",
  "plugins": [
    { "type": "aws-cni", "vethPrefix": "eni", "mtu": "9001", "pluginLogFile": "/var/log/aws-routed-eni/plugin.log" },
    { "type": "egress-cni" },
    { "type": "portmap", "capabilities": { "portMappings": true } }
  ]
}
```

`aws-node` DaemonSet이 노드에 시작될 때 하는 첫 번째 일이 이 파일을 노드 파일시스템에 복사하는 것입니다. 여기서 자주 놓치는 사실이 하나 있습니다. _`aws-node`가 죽어도 이미 실행 중인 Pod의 네트워크는 멀쩡합니다._ 라우팅 규칙은 이미 커널에 설치되어 있기 때문입니다. 반면 그 시점 이후의 **신규 Pod 생성은 전부 실패**합니다. CNI 바이너리가 말을 걸 상대가 사라졌기 때문입니다.

CNI 규약 자체는 단순합니다. containerd는 플러그인 바이너리를 실행하고, 환경 변수로 명령을 전달하며, stdin으로 JSON 설정을 넘깁니다.

```
CNI_COMMAND=ADD
CNI_CONTAINERID=<sandbox id>
CNI_NETNS=/var/run/netns/cni-xxxx
CNI_IFNAME=eth0
CNI_ARGS=K8S_POD_NAMESPACE=santa;K8S_POD_NAME=api-7d9f...
```

플러그인은 작업을 마친 뒤 결과를 stdout으로 JSON으로 돌려줍니다. 이것이 전부입니다. kubelet도 containerd도 IP를 직접 계산하거나 EC2를 호출하지 않습니다.

## Step 3. 진짜 결정은 ipamd가 한다

`aws-cni` 바이너리는 실행될 때마다 새로 뜨는 짧은 수명의 프로세스입니다. 상태를 가질 수 없으므로 IP 재고를 알 방법이 없습니다. 그래서 노드에 상주하는 데몬에게 물어봅니다.

```
aws-cni 바이너리
   |
   |  gRPC AddNetwork  ->  127.0.0.1:50051
   v
 ipamd (aws-node 파드 안에서 상주)
   |
   |  자기 메모리 안의 datastore 조회
   v
 응답: { IPv4Addr, DeviceNumber, VPCcidrs, PodVlanId, ... }
```

여기서 중요한 것은 **이 호출이 EC2로 나가지 않는다**는 점입니다. ipamd는 자기 메모리 안의 datastore만 봅니다. datastore는 대략 이런 구조입니다.

```
ENI eth0 (DeviceNumber 0)
  10.0.130.15  assigned  -> pod: santa/api-7d9f
  10.0.130.16  assigned  -> pod: santa/worker-2ab1
  10.0.130.17  free
ENI eth1 (DeviceNumber 1)
  10.0.144.32  free
  10.0.144.33  cooldown  (남은 시간 22s)
```

`AddNetwork` 요청이 오면 ipamd는 `free` 상태의 주소 하나를 골라 `assigned`로 바꾸고, 그 IP가 어느 ENI에 속하는지를 나타내는 `DeviceNumber`와 함께 반환합니다. 이 작업은 메모리 연산이므로 밀리초 단위로 끝납니다.

응답에 `DeviceNumber`가 포함되는 이유가 이 아키텍처의 핵심입니다. **어느 ENI에서 나온 IP인지에 따라 노드에 설치해야 할 라우팅 규칙이 달라지기 때문입니다.** 이어서 볼 내용입니다.

만약 `free`가 하나도 없다면 ipamd는 즉석에서 EC2를 호출하는 대신 에러를 반환하고, 플러그인은 실패합니다. kubelet은 sandbox 생성을 재시도하고, Pod는 그동안 `ContainerCreating` 상태로 남습니다. 배경 축이 새 IP를 확보하는 데 성공하면 다음 재시도에서 통과합니다. 실패한 재시도가 반복되는 동안 로그에는 이런 문구가 남습니다.

```
failed to assign an IP address to container
ipamd: no available IP addresses
```

## Step 4. 네임스페이스 조립: link-local gateway와 policy routing

IP를 받은 플러그인은 실제 배선을 합니다. 이 부분이 VPC CNI에서 가장 덜 알려져 있으면서 가장 재미있는 영역입니다.

```
                 노드 root netns                 |        Pod netns
                                                 |
   eth0 (primary ENI, 10.0.130.5)                |
   eth1 (secondary ENI, 10.0.144.5)              |
                                                 |
   enif3a9c2b1 (veth host side)  <=============>  eth0 (10.0.130.15/32)
        ^                                        |     default via 169.254.1.1
        |                                        |     169.254.1.1 dev eth0 scope link
   ip route: 10.0.130.15 dev enif3a9c2b1 scope link
```

Pod 안쪽을 보면 기묘합니다.

- 주소가 `/32`입니다. 서브넷 마스크가 없으므로 Pod 입장에서 같은 링크에 있는 이웃은 존재하지 않습니다.
- 기본 게이트웨이가 `169.254.1.1`입니다. VPC 서브넷의 실제 게이트웨이 주소가 아니라 link-local 주소입니다.

왜 이렇게 만들까요. _Pod에게 서브넷 구조를 전혀 알려주지 않기 위해서입니다._ Pod가 어느 ENI, 어느 서브넷, 어떤 프리픽스에 속하는지 몰라도 되게 만들면, 모든 Pod의 네임스페이스 설정이 동일해집니다. IP가 어느 ENI에서 나왔든 Pod 안의 라우팅 테이블은 두 줄로 끝납니다.

Pod는 나가는 패킷을 `169.254.1.1`로 보내려 하고, ARP를 물어보면 호스트 쪽 veth가 자신의 MAC으로 응답합니다. 플러그인이 정적 ARP 항목을 넣어두기도 합니다. 결국 모든 트래픽은 무조건 호스트 네임스페이스로 넘어오고, 그 다음 결정은 전부 노드가 합니다.

반대 방향은 호스트에 설치된 `/32` 라우트가 담당합니다. 그 IP로 향하는 패킷은 해당 veth로만 나갑니다.

### 왜 policy routing이 필요한가

secondary ENI에서 나온 IP를 쓰는 Pod는 문제가 하나 있습니다. 응답 패킷이 기본 라우팅 테이블을 따라가면 primary ENI(`eth0`)로 나가버립니다. 출발지 IP는 `eth1`의 것인데 실제로는 `eth0`으로 나가는 상황이 되고, VPC의 source/destination 검사에 걸려 패킷이 버려집니다.

그래서 VPC CNI는 ENI마다 별도 라우팅 테이블을 만들고 규칙으로 분기시킵니다.

```bash
ip rule show
```

```
0:      from all lookup local
512:    from all to 10.0.144.32 lookup main
1024:   from all fwmark 0x80/0x80 lookup main
1536:   from 10.0.144.32 lookup eni-1
32766:  from all lookup main
```

읽는 순서는 우선순위 숫자가 작은 쪽부터입니다.

- `512`: 그 Pod로 **들어가는** 트래픽은 main 테이블을 타고 veth로 들어갑니다.
- `1024`: connmark가 찍힌 패킷, 즉 노드 외부에서 들어와 응답으로 나가는 트래픽을 원래 들어온 경로로 되돌립니다.
- `1536`: 그 Pod에서 **나가는** 트래픽은 `eni-1` 테이블을 타고, 그 테이블의 기본 경로는 `eth1`입니다.

primary ENI의 IP를 받은 Pod에는 `1536` 규칙이 없습니다. 기본 테이블만으로 충분하기 때문입니다. 즉 **같은 노드의 Pod라도 어느 ENI에서 IP를 받았느냐에 따라 커널 규칙이 다릅니다.** ipamd 응답의 `DeviceNumber`가 여기서 쓰입니다.

### 마지막으로 SNAT

Pod IP는 VPC의 실제 IP이므로 VPC 안에서는 그대로 통합니다. RDS도, ElastiCache도 Pod IP를 그대로 봅니다. 오버레이가 없다는 것의 실질적 의미입니다.

VPC 밖으로 나갈 때만 이야기가 달라집니다.

```bash
iptables -t nat -L AWS-SNAT-CHAIN-0 -n
```

기본값(`AWS_VPC_K8S_CNI_EXTERNALSNAT=false`)에서는 목적지가 VPC CIDR이 아닌 트래픽만 노드 primary IP로 SNAT됩니다. 이 설정을 `true`로 바꾸면 SNAT을 하지 않고 Pod IP 그대로 내보내며, 외부와의 연결은 NAT Gateway나 Transit Gateway 같은 상위 계층이 책임집니다. 온프레미스에서 Pod IP를 직접 봐야 하는 경우에 쓰는 선택지입니다.

`AWS_VPC_K8S_CNI_RANDOMIZESNAT`는 SNAT 시 출발지 포트를 무작위화할지를 정합니다. 노드 하나의 IP 뒤로 수십 개 Pod가 몰리면 포트 튜플 충돌이 실제 문제가 되기 때문에 존재하는 옵션입니다.

## Step 5. 배경 축: warm pool은 무엇을 보고 움직이는가

지금까지가 요청 축입니다. 이 축이 빠른 이유는 단 하나, 꺼내 쓸 재고가 이미 있었기 때문입니다. 그 재고를 채우는 것이 배경 축입니다.

ipamd는 주기적으로 datastore를 점검하고 목표치에 못 미치면 EC2 API를 호출합니다. 목표치를 정하는 변수는 네 개이고, 조합에 따라 동작이 꽤 달라집니다.

| 변수 | 의미 | 특징 |
|------|------|------|
| `WARM_ENI_TARGET` | 여유 ENI를 몇 장 유지할지 | 기본값 1. ENI 단위이므로 IP를 크게 잡아둡니다 |
| `WARM_IP_TARGET` | 여유 IP를 몇 개 유지할지 | IP 단위 미세 제어. 서브넷이 빠듯할 때 사용 |
| `MINIMUM_IP_TARGET` | 최소 확보 IP 수 | 노드 부팅 직후 버스트를 흡수 |
| `WARM_PREFIX_TARGET` | 여유 `/28` 프리픽스를 몇 개 유지할지 | prefix delegation 모드 전용 |

`WARM_ENI_TARGET=1`은 "ENI 한 장 분량의 IP는 항상 놀려 두겠다"는 뜻입니다. 큰 인스턴스에서는 이것만으로 수십 개의 IP가 선점됩니다. 노드가 많고 서브넷이 좁으면 이 여유분들의 합이 서브넷을 고갈시킬 수 있습니다. 반대로 `WARM_IP_TARGET`을 작게 잡으면 IP는 아끼지만 스케일아웃 때마다 EC2 호출이 발생해 Pod 시작이 느려집니다.

_이 변수들은 결국 "서브넷 IP를 아낄 것인가, Pod 시작 지연을 아낄 것인가"라는 하나의 트레이드오프를 조절하는 손잡이입니다._

EC2 호출은 두 종류입니다.

```
IP만 더 필요하다
  -> AssignPrivateIpAddresses (기존 ENI의 빈 슬롯 채우기, 비교적 빠름)

ENI 슬롯이 다 찼다
  -> CreateNetworkInterface
  -> AttachNetworkInterface       <- 수 초 소요
  -> ModifyNetworkInterfaceAttribute
  -> 커널이 새 인터페이스를 인식할 때까지 대기
  -> AssignPrivateIpAddresses
```

ENI 부착은 이 경로 전체에서 가장 느린 구간입니다. prefix delegation이 의미 있는 이유가 여기 있습니다. 한 번의 할당으로 16개를 확보하므로 ENI를 새로 붙일 일이 훨씬 드물어집니다.

대신 prefix 모드에는 고유한 실패 조건이 있습니다. **`/28`은 연속된 블록이어야 합니다.** 서브넷의 전체 여유 IP가 수백 개여도, 오래 쓴 서브넷이 파편화되어 연속된 16개를 못 만들면 할당이 실패합니다. 총량만 보고 여유가 있다고 판단하면 이 실패를 예측할 수 없습니다.

여기서 또 하나 놓치기 쉬운 지점이 있습니다. **kubelet의 `maxPods` 계산과 CNI의 모드 설정은 서로 다른 곳에서 결정됩니다.** 노드를 만드는 주체(관리형 노드그룹의 부트스트랩 스크립트, Karpenter 같은 프로비저너)가 자체적으로 `maxPods`를 계산하는데, 이때 `aws-node` DaemonSet의 `ENABLE_PREFIX_DELEGATION` 값을 읽지 않는 경우가 있습니다. 그러면 CNI는 prefix 모드로 도는데 kubelet은 secondary IP 기준 숫자를 광고하거나, 그 반대가 됩니다.

후자가 Step 1에서 말한 조용한 장애입니다. kubelet은 prefix 기준의 큰 숫자를 광고하고, CNI는 그만큼 공급하지 못합니다. 그 차이 구간의 Pod는 이벤트 하나 없이 `ContainerCreating`에 머뭅니다.

## Step 6. 반환: IP는 즉시 재사용되지 않는다

Pod가 삭제되면 kubelet은 sandbox를 정리하면서 `CNI_COMMAND=DEL`로 플러그인을 호출합니다.

```
containerd -> aws-cni (DEL) -> ipamd DelNetwork
   veth 삭제
   ip rule 삭제
   해당 IP를 datastore에서 'cooldown' 상태로 전환
   기본 30초 후 'free'
```

바로 `free`로 돌리지 않는 이유는 conntrack입니다. 방금 사라진 Pod와 통신하던 상대들의 커넥션 추적 항목이 노드와 상대편에 아직 남아 있습니다. 같은 IP를 즉시 다른 Pod에게 주면, 이전 커넥션에 속한 패킷이 엉뚱한 Pod로 배달되거나 RST를 유발할 수 있습니다. cooldown은 그 잔여물이 만료될 시간을 벌어주는 장치입니다.

_그래서 Pod를 대량으로 갈아치우는 배포 직후에는 "삭제는 끝났는데 IP는 아직 안 돌아온" 구간이 존재합니다._ 노드가 IP 한계에 근접해 있으면 이 30초가 그대로 신규 Pod의 대기 시간이 됩니다.

### ipamd가 재시작되면

ipamd의 datastore는 메모리에 있습니다. 그렇다면 `aws-node`가 재시작되면 어떤 IP가 누구에게 할당되어 있었는지 잊어버릴까요.

잊지 않습니다. ipamd는 상태를 체크포인트 파일에 기록합니다.

```
/var/run/aws-node/ipam.json
```

재시작 시 이 파일을 읽어 datastore를 복원합니다. 이 장치가 없으면 살아 있는 Pod의 IP가 `free`로 오인되어 이중 할당이 발생하거나, 반대로 회수되지 못한 IP가 영구히 잠기는 leak이 생깁니다. 실제로 초기 버전들에서 이 복원 경로가 IP leak 버그의 단골 원인이었습니다.

## 전체 경로를 한 장으로

```
kube-scheduler
   | allocatable.pods 만 보고 배치 (IP 가용성은 확인하지 않음)
   v
kubelet -- RunPodSandbox --> containerd
                               | pause 컨테이너 + netns 생성
                               v
                            /etc/cni/net.d/10-aws.conflist 읽기
                               | CNI_COMMAND=ADD
                               v
                            aws-cni 바이너리 (단명 프로세스)
                               | gRPC AddNetwork -> 127.0.0.1:50051
                               v
                            ipamd datastore
                               | free IP 하나를 assigned 로 전환
                               | IP + DeviceNumber 반환          [EC2 호출 없음]
                               v
                            네임스페이스 조립
                               | veth pair, /32 라우트
                               | default via 169.254.1.1
                               | DeviceNumber != 0 이면 ip rule 추가
                               v
                            Pod Running

                     [별도 루프] ipamd 조정
                               | 여유분 < 목표치?
                               v
                            EC2 AssignPrivateIpAddresses
                            또는 ENI Create/Attach (수 초)
```

## 실패 지점 지도

경로를 다 따라가면 실패 가능 지점이 몇 개인지가 보입니다.

| 증상 | 실제 원인 | 확인 방법 |
|------|-----------|-----------|
| Pod가 `ContainerCreating`에 멈춤, 이벤트에 원인 없음 | kubelet `maxPods` > CNI 실제 공급량 | `allocatable.pods`와 인스턴스 ENI 한도 공식을 대조 |
| 특정 노드에서만 신규 Pod 실패 | 해당 노드 ENI 슬롯 소진, 확장 여력 0 | ipamd introspection으로 ENI/IP 재고 확인 |
| 클러스터 전역에서 IP 할당 실패 | 서브넷 IP 고갈 | 서브넷 여유 IP 직접 확인. CNI 메트릭에는 노출되지 않음 |
| 여유 IP는 충분한데 prefix 할당만 실패 | 서브넷 파편화로 연속 `/28` 확보 불가 | 서브넷 IP 사용 패턴 확인 |
| 스케일아웃 때만 Pod 시작이 느려짐 | warm pool 부족으로 동기 ENI 부착 발생 | `awscni_aws_api_latency`와 EC2 호출률 |
| `aws-node` 재시작 후 신규 Pod 전부 실패 | ipamd 미기동. 기존 Pod는 정상 | `aws-node` 파드 상태와 ipamd 로그 |
| 애드온 업그레이드 후 조용히 동작이 바뀜 | 라이브 DaemonSet에만 있던 env가 기본값으로 되돌아감 | 애드온 설정값과 실제 DaemonSet env 비교 |

마지막 항목은 관리형 애드온을 쓸 때 특히 조심해야 합니다. EKS 관리형 애드온은 업그레이드 시 자신이 알고 있는 설정값으로 DaemonSet을 다시 씁니다. `kubectl`로 직접 넣은 환경 변수는 애드온의 설정에 없으므로 조용히 사라집니다. _설정의 단일 출처는 라이브 DaemonSet이 아니라 애드온의 configuration values입니다._

## 직접 확인하는 법

이 글의 내용은 전부 노드에서 검증할 수 있습니다.

ipamd의 내부 상태는 introspection 엔드포인트로 볼 수 있습니다. localhost 전용이라 노드 안에서만 접근됩니다.

```bash
curl -s http://localhost:61679/v1/enis | jq .
curl -s http://localhost:61679/v1/pods | jq .
```

메트릭은 별도 포트입니다. 여기서 나오는 `awscni_*` 시리즈가 대시보드와 알럿의 재료가 됩니다.

```bash
curl -s http://localhost:61678/metrics | grep awscni_
```

눈여겨볼 지표는 다음과 같습니다.

- `awscni_total_ip_addresses`, `awscni_assigned_ip_addresses`: 재고와 사용량
- `awscni_ipamd_error_count`: 할당 실패의 직접 신호
- `awscni_aws_api_latency_ms`: 배경 축이 느려지고 있는지
- `awscni_eni_allocated`, `awscni_eni_max`: 확장 여력이 남았는지

로그는 두 갈래로 나뉩니다. 데몬의 로그와, 호출될 때마다 잠깐 실행되는 플러그인의 로그입니다.

```bash
/var/log/aws-routed-eni/ipamd.log     # 배경 축: EC2 호출, warm pool 조정
/var/log/aws-routed-eni/plugin.log    # 요청 축: 개별 Pod의 ADD/DEL
```

특정 Pod가 왜 IP를 못 받았는지 추적할 때는 `plugin.log`에서 시작해 `ipamd.log`로 넘어가는 순서가 자연스럽습니다. 요청 축이 실패한 이유는 대개 배경 축에 적혀 있기 때문입니다.

커널 쪽 결과물도 직접 볼 수 있습니다.

```bash
ip rule show
ip route show table all | grep eni
iptables -t nat -L AWS-SNAT-CHAIN-0 -n
```

## 결론

VPC CNI의 IP 할당은 하나의 절차가 아니라 두 개의 독립된 루프입니다.

요청 축은 Pod가 만들어질 때 동기적으로 실행되며, 로컬 gRPC 한 번과 네임스페이스 조작으로 끝납니다. 이 축은 EC2를 모릅니다. 배경 축은 그와 무관하게 계속 돌면서 EC2 API로 재고를 채웁니다. 이 축은 Pod를 모릅니다. 둘을 잇는 유일한 접점이 ipamd의 datastore입니다.

이 구조를 알면 다음이 자연스럽게 설명됩니다.

- Pod 시작이 대체로 빠른 이유: 재고에서 꺼내 쓰기 때문입니다.
- 가끔만 느린 이유: 재고가 비어 ENI 부착을 기다리기 때문입니다.
- `aws-node`가 죽어도 기존 Pod는 멀쩡한 이유: 규칙은 이미 커널에 있기 때문입니다.
- IP가 즉시 재사용되지 않는 이유: conntrack 잔여물 때문입니다.
- 그리고 아무 에러 없이 배포가 멈추는 이유: kubelet이 광고한 숫자와 CNI가 공급 가능한 숫자를 대조하는 주체가 없기 때문입니다.

_마지막 항목이 이 글에서 가장 실무적인 교훈입니다. `allocatable.pods`는 실측이 아니라 선언이며, 그 선언을 만든 주체와 IP를 실제로 공급하는 주체가 다르다면 언제든 어긋날 수 있습니다._ 노드를 만드는 쪽과 CNI 설정을 바꾸는 쪽이 분리된 환경이라면, 두 숫자를 주기적으로 대조하는 것이 이 계층에서 할 수 있는 가장 값싼 예방책입니다.

## 참고 자료

- amazon-vpc-cni-k8s (GitHub)
- CNI Specification
- Amazon EKS: Pod networking (CNI)
- Amazon EKS: Increase the amount of available IP addresses for your nodes
- Amazon VPC: Assigning prefixes to network interfaces
- Kubernetes: Container Runtime Interface
