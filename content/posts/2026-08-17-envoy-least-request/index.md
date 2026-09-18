---
title: "왜 LEAST_REQUEST를 사용하고 있을까?"
description: "Envoy LEAST_REQUEST의 요청 선택 경로, P2C, active request 생명주기와 실패 조건을 살펴보고 현재 워크로드에 적합한지 검증하는 방법을 정리합니다."
date: 2026-08-17
status: writing
tags:
  - Envoy
  - Istio
  - Load Balancing
---

<aside>

_LEAST_REQUEST를 사용하는 이유는 항상 가장 한가한 Pod를 정확히 찾기 위해서가 아닙니다. 각 Envoy가 이미 알고 있는 진행 중 요청 수를 이용해, 느려진 Endpoint로 신규 요청이 계속 유입되는 것을 낮은 비용으로 완화하기 위해서입니다._

</aside>

## 왜 LEAST_REQUEST를 사용하고 있을까?

제가 입사했을 때부터 우리 시스템은 `LEAST_REQUEST`를 사용하고 있었습니다. 이 설정은 관성처럼 이어졌고, 왜 선택했는지에 대한 의사결정 기록은 아직 찾지 못했습니다.

문제는 설정의 존재가 아닙니다. 다음 질문에 답하지 못한다는 점입니다.

- Envoy는 무엇을 기준으로 요청이 적다고 판단할까요?
- 그 숫자는 누가, 어디에서 기록할까요?
- Endpoint가 수백 개라면 매번 전체를 탐색할까요?
- 느린 Pod와 자원이 부족한 Pod를 실제로 구분할 수 있을까요?
- 우리 워크로드에서도 이 알고리즘의 가정이 성립할까요?

이 글에서는 `LEAST_REQUEST`의 내부 동작을 요청 선택 경로, P2C(Power of Two Choices), active request의 생명주기, 실패 조건 순서로 살펴봅니다. 마지막에는 과거 선택을 정당화하는 대신 현재도 이 설정이 적합한지 검증하는 방법을 정리합니다.

## LEAST_REQUEST는 어디에서 동작하는가?

Istio의 트래픽 처리는 크게 설정 축과 요청 축으로 나눌 수 있습니다.

### 설정 축: istiod가 Envoy에 선택 재료를 전달한다

```
Kubernetes API
  Service / EndpointSlice / Pod readiness
  DestinationRule / VirtualService
        │ watch
        ▼
      istiod
        │ xDS push
        ▼
Sidecar 또는 Gateway Envoy

LDS: listener와 filter chain
RDS: route와 목적지 cluster
CDS: cluster와 LB policy
EDS: Endpoint 주소, health, locality, weight
```

istiod는 어떤 Endpoint가 존재하며 어떤 정책을 사용할지 Envoy에 전달합니다. 하지만 요청이 들어올 때마다 가장 한가한 Pod를 중앙에서 계산하지는 않습니다.

실제 Endpoint 선택은 데이터 플레인의 Envoy가 수행합니다.

### 요청 축: route가 cluster를 고르고 LB가 Endpoint를 고른다

```
Application
  → iptables 또는 Istio CNI가 outbound 트래픽을 Envoy로 전달
  → listener와 filter chain 매칭
  → HTTP Host, SNI, 원래 목적지 IP:port 등을 이용해 route 결정
  → route가 upstream cluster 선택
  → health, priority, locality 등으로 후보 집합 결정
  → LEAST_REQUEST가 후보 중 Endpoint 선택
  → 선택된 Endpoint의 connection pool 사용
  → 상대 Pod의 Envoy 또는 application으로 전달
```

HTTP 트래픽에서는 RDS route가 cluster를 선택할 수 있습니다. TCP나 TLS 트래픽은 HTTP `Host` 헤더가 없으므로 원래 목적지, port, SNI 같은 다른 정보가 사용됩니다.

Sidecar 모드의 서비스 간 outbound 트래픽에서는 호출자 Pod의 sidecar가 Endpoint를 선택합니다. Istio ingress 또는 egress gateway가 호출 주체라면 gateway Envoy가 선택합니다.

_RDS는 어느 서비스 또는 subset으로 보낼지를 결정하고, LEAST_REQUEST는 선택된 cluster 안에서 어느 Endpoint로 보낼지를 결정합니다._

## LEAST_REQUEST가 세는 것은 무엇인가?

이름 그대로 Envoy가 비교하는 값은 host별 active request 수입니다.

정확히는 해당 Envoy가 선택한 upstream host에 대해 아직 종료되지 않은 요청 또는 stream 수를 의미합니다.

```
Endpoint 선택
  → upstream 요청 또는 stream 시작
  → 해당 host의 rq_active 증가
  → 응답 완료, timeout, reset 등으로 요청 종료
  → rq_active 감소
```

active request는 다음 값과 다릅니다.

- CPU 사용률이 아닙니다.
- 메모리 사용량이 아닙니다.
- 애플리케이션 내부 작업 큐 길이가 아닙니다.
- 전체 mesh가 공유하는 전역 요청 수가 아닙니다.
- HTTP/2 connection 수가 아닙니다.

각 Envoy는 자신이 보낸 요청만 알고 있습니다. Client sidecar가 20개라면 Endpoint별 active request 관측값도 20세트입니다.

```
Sidecar A: pod-1=5, pod-2=1, pod-3=0
Sidecar B: pod-1=0, pod-2=4, pod-3=2
Sidecar C: pod-1=2, pod-2=0, pod-3=3
```

전역적으로 `pod-1`이 가장 바쁘더라도 Sidecar B가 보낸 진행 중 요청이 없다면 Sidecar B는 `pod-1`을 한가한 후보로 볼 수 있습니다.

이 구조는 의도적인 트레이드오프입니다.

- 중앙 부하 수집기가 필요하지 않습니다.
- 요청 경로에서 원격 부하 정보를 조회하지 않습니다.
- 각 Envoy가 직접 관측한 최신 완료 상태를 사용합니다.
- 전역 최적 선택은 보장하지 않습니다.

## P2C: 전체를 탐색하지 않고 두 개만 비교한다

이름만 보면 모든 Endpoint의 active request를 확인한 뒤 최솟값을 찾을 것처럼 보입니다. 기본 동작은 그렇지 않습니다.

모든 Endpoint의 weight가 같을 때 Envoy는 기본적으로 다음 과정을 수행합니다.

1. 현재 선택 가능한 healthy host 중 하나를 무작위로 뽑습니다.
2. 두 번째 host를 무작위로 뽑습니다.
3. 두 host의 active request 수를 비교합니다.
4. 값이 더 작은 host를 선택합니다.

의사 코드는 다음과 같습니다.

```
candidate = random_host()

repeat choice_count - 1 times:
    sampled = random_host()

    if sampled.active_requests < candidate.active_requests:
        candidate = sampled

return candidate
```

Envoy의 기본 `choice_count`는 2입니다. 후보 수가 고정되어 있으므로 Endpoint가 늘어나도 선택 비용은 사실상 O(1)입니다.

최신 Envoy에는 전체 host를 확인하는 `FULL_SCAN` 방식도 있습니다. 하지만 기본값은 `N_CHOICES`이며, 대부분의 환경에는 P2C가 권장됩니다.

### 왜 하필 두 개인가?

고전적인 balls-and-bins 모델에서 N개의 요청을 N개의 서버에 배치한다고 가정합니다.

- 후보 1개를 무작위 선택하면 최대 부하는 대략 `log N / log log N`입니다.
- 후보 d개 중 최소 부하를 선택하면 `log log N / log d + O(1)`입니다.
- 후보를 1개에서 2개로 늘릴 때 최대 부하가 크게 줄어듭니다.
- 후보를 2개보다 더 늘렸을 때의 추가 개선은 상대적으로 작습니다.

_P2C는 전역 최솟값의 정확도를 포기하고, 고정된 선택 비용과 충분히 좋은 분산 품질을 얻는 알고리즘입니다._

이 결과를 실제 Envoy에 그대로 적용할 수는 없습니다. 논문의 기본 모델은 요청과 서버가 동일하고, 요청 배치만 고려합니다. 실제 환경에서는 요청 처리 시간이 다르고 요청이 계속 완료되며, 각 Envoy가 서로 다른 로컬 상태를 봅니다. 따라서 이론은 Envoy 설계의 배경으로 이해해야 합니다.

### Endpoint가 2개뿐이면 항상 덜 바쁜 쪽을 선택할까?

항상 그렇지는 않습니다. 기본 P2C는 후보를 독립적으로 추출할 수 있습니다.

Endpoint가 A와 B 두 개이고 A가 더 바쁘다고 가정합니다. 두 번 모두 A가 뽑힐 확률은 다음과 같습니다.

$$
P(A, A) = \frac{1}{2} \times \frac{1}{2} = \frac{1}{4}
$$

따라서 Endpoint가 두 개뿐이어도 더 바쁜 A가 선택될 가능성이 25% 존재합니다. 전역 최소를 반드시 선택해야 하는 매우 작은 host 집합과 낮은 요청률에서는 `FULL_SCAN`이 더 적합할 수 있습니다.

## 느린 Pod를 별도 CPU 지표 없이 피하는 원리

LEAST_REQUEST의 핵심은 active request가 단순한 요청 개수 이상의 정보를 간접적으로 포함한다는 점입니다.

Little's Law를 단순화하면 다음 관계를 얻을 수 있습니다.

$$
L = \lambda W
$$

- `L`: 시스템 안에 머무는 평균 요청 수
- `λ`: 평균 요청 도착률
- `W`: 평균 요청 처리 시간

두 Pod에 비슷한 요청률이 들어오는 상황을 가정합니다.

| Endpoint | 요청률  | 평균 처리 시간 | 예상 active request |
| -------- | ------- | -------------- | ------------------- |
| Pod A    | 100 RPS | 50ms           | 약 5개              |
| Pod B    | 100 RPS | 500ms          | 약 50개             |

Pod B가 느려지면 요청이 완료되지 않고 더 오래 남습니다. 결과적으로 Pod B의 active request가 증가하며, P2C 후보에 Pod A와 Pod B가 같이 등장하면 Pod A가 선택될 가능성이 높아집니다.

Round Robin은 Endpoint의 현재 상태와 관계없이 순서대로 요청을 전달합니다. LEAST_REQUEST는 요청 완료 속도를 다음 선택에 반영합니다.

_LEAST_REQUEST는 CPU를 직접 측정하지 않지만, 처리 지연으로 누적된 진행 중 요청을 피드백 신호로 사용합니다._

이 피드백이 유효하려면 active request 수와 실제 Endpoint 포화도 사이에 상관관계가 있어야 합니다. 상관관계가 있다는 사실만으로 active request 증가가 CPU 부족 때문에 발생했다고 단정할 수는 없습니다. 외부 API 지연, database lock, network 지연도 요청 완료를 늦출 수 있습니다.

## HTTP/1.1, HTTP/2, gRPC에서는 무엇이 달라질까?

### HTTP/1.1

일반적인 HTTP/1.1 connection에서는 한 시점에 처리하는 요청 수가 제한됩니다. Connection 수와 active request 수가 비슷하게 움직일 수 있지만 두 값은 동일한 개념이 아닙니다.

### HTTP/2와 Unary gRPC

HTTP/2는 하나의 TCP connection 위에 여러 stream을 다중화합니다.

```
TCP connection 1개
  ├─ gRPC stream 1
  ├─ gRPC stream 2
  ├─ gRPC stream 3
  └─ gRPC stream N
```

Connection 수만 비교하면 하나의 connection에서 처리 중인 수십 개 요청을 구분할 수 없습니다. Envoy가 request 또는 stream 단위의 active count를 사용하는 이유입니다.

Kubernetes Service와 kube-proxy만 사용하는 경로에서는 일반적으로 TCP connection이 만들어질 때 Endpoint가 결정됩니다. gRPC client가 connection을 오래 유지하면 이후 RPC가 같은 Endpoint로 계속 전달될 수 있습니다. L7 Envoy는 새로운 HTTP/2 stream을 upstream request로 처리하며 host 선택과 connection pool 사용을 분리할 수 있습니다.

### Streaming gRPC와 SSE

장시간 유지되는 stream은 active request를 오랫동안 차지합니다. 하지만 연결이 열려 있다는 사실이 높은 CPU 사용량을 뜻하지는 않습니다.

예를 들어 이벤트를 거의 보내지 않는 SSE connection 100개와 GPU 추론 요청 1개 중 어느 쪽이 더 비싼지는 active request 수만으로 알 수 없습니다.

_LEAST_REQUEST는 동시 요청 수가 처리 비용을 잘 대변하는 워크로드에는 강하지만, 요청별 비용 편차가 큰 워크로드에는 불완전한 부하 신호입니다._

## P2C가 적용되기 전에 후보 집합이 먼저 결정된다

LEAST_REQUEST는 EDS에 포함된 모든 Pod를 무조건 비교하지 않습니다.

```
전체 Endpoint
  → route와 subset
  → priority
  → health와 outlier ejection
  → locality
  → 최종 후보 host 집합
  → LEAST_REQUEST
```

### Priority

Envoy는 일반적으로 가장 높은 priority의 healthy host를 우선 사용합니다. Multi-region 또는 failover 구성이 있다면 원격 region의 Endpoint는 P2C 후보에 들어오지 않을 수 있습니다.

### Health와 outlier detection

Readiness와 EDS health 상태, passive outlier detection 등에 따라 Endpoint가 후보에서 제외될 수 있습니다.

LEAST_REQUEST는 느려진 host로 향하는 신규 요청을 줄일 수 있지만, 이미 들어간 요청을 복구하지는 않습니다. Timeout, retry, outlier detection과 함께 봐야 하는 이유입니다.

### Locality

Envoy가 먼저 locality를 선택하고 해당 locality 안에서 Endpoint를 선택하는 구성에서는 LEAST_REQUEST가 전체 zone의 Pod를 비교하지 않습니다.

예를 들어 세 AZ에 Pod가 하나씩 있고 호출자와 같은 AZ의 Pod만 우선 선택된다면, LEAST_REQUEST가 비교할 host가 하나뿐일 수 있습니다. 설정에는 `LEAST_REQUEST`라고 표시되어도 알고리즘의 실질적인 효과는 없습니다.

### Slow start

신규 또는 복구된 Endpoint는 모든 Envoy에서 active request가 0으로 보일 수 있습니다. 여러 Envoy가 동시에 새 Endpoint를 선택하면 cold cache, JIT warm-up, connection 초기화가 끝나기 전에 트래픽이 몰릴 수 있습니다.

Slow start는 신규 Endpoint의 유효 weight를 서서히 높여 이 문제를 완화합니다.

## Endpoint weight가 다르면 선택 방식도 달라진다

모든 host weight가 같으면 Envoy는 P2C를 사용합니다. Host weight가 다르면 active request를 반영한 동적 유효 가중치를 계산합니다.

$$
effective\_weight =
\frac{load\_balancing\_weight}
{(active\_requests + 1)^{active\_request\_bias}}
$$

기본 `active_request_bias`는 1.0입니다.

예를 들어 host의 기본 weight가 2이고 active request가 4라면 다음과 같습니다.

$$
effective\_weight = \frac{2}{4 + 1} = 0.4
$$

`active_request_bias`가 커질수록 진행 중 요청이 host의 유효 weight를 더 공격적으로 낮춥니다. 값이 0이면 active request를 무시하므로 Round Robin과 유사하게 동작합니다.

VirtualService의 90:10 트래픽 분할과 Endpoint host weight는 구분해야 합니다. VirtualService weight는 먼저 목적지 cluster 또는 subset을 고르는 route 비율입니다. 그 이후 선택된 cluster 안에서 LB 정책이 Endpoint를 선택합니다.

## LEAST_REQUEST가 잘 동작하는 조건과 깨지는 조건

| 조건                            | 평가             | 메커니즘                                             |
| ------------------------------- | ---------------- | ---------------------------------------------------- |
| 응답 시간 편차가 큰 HTTP API    | 유리             | 느린 Endpoint의 active request가 누적됩니다.         |
| 충분한 동시성이 있는 Unary gRPC | 유리             | Connection이 아닌 stream 단위로 분산합니다.          |
| 요청이 매우 짧고 희소함         | 효과가 작음      | 대부분의 host가 항상 active request 0입니다.         |
| SSE와 장시간 stream             | 주의             | Stream 수와 실제 자원 사용량이 다를 수 있습니다.     |
| GPU 또는 요청별 비용 편차가 큼  | 주의             | 모든 요청을 동일한 1개로 계산합니다.                 |
| 신규 Pod의 cold start           | 주의             | 여러 Envoy가 동시에 active request 0으로 관측합니다. |
| Locality당 Endpoint가 하나임    | 효과가 거의 없음 | Endpoint 선택 단계의 후보가 하나뿐입니다.            |
| 세션 고정이 필요함              | 부적합할 수 있음 | Consistent hash와 요구사항이 다릅니다.               |

### 다른 알고리즘과 비교

| 정책                     | 성능 특성                               | 운영 부담 | 주요 위험                                                          |
| ------------------------ | --------------------------------------- | --------- | ------------------------------------------------------------------ |
| ROUND_ROBIN              | 균등 순회, Endpoint 상태 피드백 없음    | 낮음      | 느린 Endpoint에도 같은 비율로 요청을 전달합니다.                   |
| RANDOM                   | O(1), 장기적으로 균등                   | 낮음      | 순간 편차와 느린 Endpoint 회피 능력이 제한됩니다.                  |
| LEAST_REQUEST            | O(1) P2C, 완료 속도를 간접 반영         | 낮음      | 로컬 관측과 요청 개수라는 불완전한 신호를 사용합니다.              |
| CONSISTENT_HASH          | 요청 key를 같은 Endpoint에 매핑         | 중간      | Endpoint 변경 시 일부 key가 이동하며 부하 편중이 생길 수 있습니다. |
| 서버 부하 피드백 기반 LB | CPU, utilization 등 실제 용량 반영 가능 | 높음      | 서버 계측, 보고 지연, 설정 복잡도가 증가합니다.                    |

## 우리는 왜 사용하고 있을까?

여기서 메커니즘상의 선택 이유와 우리 팀의 실제 의사결정 배경을 구분해야 합니다.

Envoy와 현재 Istio 문서는 일반적인 환경에서 `LEAST_REQUEST`를 안전한 기본 선택으로 설명합니다. 하지만 공식 문서의 추천이 우리 서비스에서 효과가 검증되었다는 뜻은 아닙니다.

현재 가능한 가설은 다음과 같습니다.

1. 팀이 응답 시간 편차나 gRPC 분산 문제를 해결하기 위해 명시적으로 선택했습니다.
2. 공통 DestinationRule 또는 Helm template을 다른 서비스에서 가져왔습니다.
3. 별도 의사결정 없이 Istio가 생성한 기본 LB 정책을 사용하고 있습니다.
4. 과거 Istio upgrade 과정에서 기본 동작이 바뀌었고 이후 관성적으로 유지했습니다.

_의사결정 기록을 찾지 못했다면 “우리 팀이 선택했다”고 결론 내리기보다, 기본값 또는 상속된 설정을 현재 워크로드 기준으로 재검증한다고 표현하는 것이 정확합니다._

### 설정 히스토리 확인

```bash
rg -n "LEAST_REQUEST|LEAST_CONN" .
git log -S'LEAST_REQUEST' --all --oneline
git blame <destination-rule-file>
```

확인할 내용은 다음과 같습니다.

- 최초 도입 commit과 Pull Request
- 당시 Istio version
- 장애 또는 성능 문제와 연결된 의사결정 기록
- 공통 chart나 template에서 상속되는지 여부
- DestinationRule을 제거했을 때 적용되는 실제 기본값

### 실제 Envoy 설정 확인

Git의 YAML은 의도이며, Envoy config dump는 적용 결과입니다.

```bash
istioctl proxy-config cluster <client-pod> -n <namespace> \
  --fqdn <service-fqdn> -o json
```

다음 항목을 확인합니다.

- 실제 `lbPolicy`
- Endpoint 수와 health
- priority와 locality
- Endpoint별 weight
- slow start
- outlier detection
- subset별 cluster
- 실제 Endpoint를 선택하는 Envoy가 sidecar인지 gateway인지

Host별 active request는 Envoy admin의 cluster 정보를 통해 확인할 수 있습니다.

```bash
kubectl -n <namespace> exec <client-pod> -c istio-proxy -- \
  pilot-agent request GET clusters
```

운영 환경에서는 출력량과 민감 정보를 확인한 뒤 대상 cluster와 `rq_active`만 필터링해야 합니다.

## 비교 실험으로 가설 검증하기

문서만으로는 우리 환경에서 `LEAST_REQUEST`가 더 낫다고 결론 내릴 수 없습니다. 동일 조건에서 정책별 차이를 측정해야 합니다.

### 실험 설계

1. 같은 application을 실행하는 Endpoint 3개를 준비합니다.
2. 한 Endpoint에만 300∼500ms의 지연을 주입합니다.
3. 동일한 요청률과 concurrency로 부하를 발생시킵니다.
4. `ROUND_ROBIN`, `RANDOM`, `LEAST_REQUEST`를 한 번에 하나씩 적용합니다.
5. 정책별 Endpoint 분포와 tail latency를 비교합니다.

### 측정 항목

- Endpoint별 RPS
- Endpoint별 active request
- 전체 p50, p95, p99 latency
- Timeout과 5xx
- Endpoint별 CPU와 memory
- 느린 Endpoint가 받은 요청 비율
- 신규 Endpoint 추가 직후 트래픽 증가율

### 예상 가설

- `ROUND_ROBIN`: 느린 Endpoint에도 계속 비슷한 비율로 요청을 전달합니다.
- `RANDOM`: 장기적으로는 균등하지만 느린 Endpoint 상태를 반영하지 않습니다.
- `LEAST_REQUEST`: 느린 Endpoint의 active request가 누적되면서 신규 요청 비율이 감소합니다.

실험의 목적은 `LEAST_REQUEST`가 항상 우월하다는 결론을 만드는 것이 아닙니다. 우리 요청의 active count가 실제 Endpoint 포화도를 얼마나 잘 대변하는지 확인하는 것입니다.

### 실험 위험과 롤백

- _Blast radius_
  - 별도 test namespace와 테스트 트래픽으로 제한합니다.
- _실패 시나리오_
  - DestinationRule의 host 또는 export 범위를 잘못 지정하면 실제 서비스 트래픽에 정책이 적용될 수 있습니다.
- _롤백_
  - GitOps commit을 revert하고 ArgoCD 동기화 상태를 확인합니다.
- _운영 원칙_
  - 운영 resource를 `kubectl edit`로 직접 변경하지 않습니다.

## 운영 관점에서 함께 봐야 할 것

`LEAST_REQUEST`만으로 장애 대응이 완성되지는 않습니다.

- Timeout이 없으면 이미 느린 Endpoint로 들어간 요청이 오래 묶일 수 있습니다.
- Retry가 과하면 느린 upstream에 추가 부하를 만들 수 있습니다.
- Outlier detection이 없으면 반복적으로 실패하는 Endpoint를 후보에서 제거하지 못할 수 있습니다.
- Slow start가 없으면 신규 Pod에 초기 트래픽이 집중될 수 있습니다.
- Locality 설정이 후보를 지나치게 좁히면 LEAST_REQUEST의 선택 효과가 사라질 수 있습니다.

관측과 대응 기준도 필요합니다.

- 배포 직후 p99와 Endpoint별 RPS 편차를 확인합니다.
- 특정 Endpoint의 latency 증가와 요청 감소가 함께 나타나는지 확인합니다.
- LB 편중과 application 자체 지연을 구분할 수 있는 dashboard를 준비합니다.
- 배포 직후 latency 급등과 outlier ejection에 대한 alert를 검토합니다.
- 정책 변경과 장애 대응 절차를 runbook으로 남깁니다.

## 결론

LEAST_REQUEST는 모든 Endpoint를 조사해 전역적으로 가장 한가한 Pod를 찾는 알고리즘이 아닙니다.

각 Envoy가 선택 가능한 후보 중 기본적으로 두 개를 무작위로 뽑고, 자신이 관측한 active request가 적은 쪽을 선택합니다. 이 방식은 O(1)에 가까운 비용으로 느린 Endpoint에 요청이 계속 누적되는 상황을 완화합니다.

그러나 active request는 실제 자원 사용량이 아니라 대리 신호입니다. Client마다 관측값이 다르며, streaming이나 요청 비용 편차가 큰 워크로드에서는 부정확할 수 있습니다. Priority와 locality가 후보를 먼저 좁히면 알고리즘의 효과가 사라질 수도 있습니다.

_따라서 우리가 LEAST_REQUEST를 계속 사용할 근거는 “Istio의 기본값이기 때문”이 아니라, active request가 우리 서비스의 포화도와 상관관계를 보이고 비교 실험에서 tail latency와 Endpoint 편중을 실제로 줄였기 때문이어야 합니다._

## 참고 자료

- Envoy Supported Load Balancers
- Envoy Least Request Load Balancing Policy
- Istio DestinationRule
- Istio Traffic Management
- The Power of Two Choices in Randomized Load Balancing
- The Power of Two Random Choices: A Survey of Techniques and Results
