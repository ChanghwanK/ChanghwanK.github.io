---
layout: single
title: About
permalink: /about/
author_profile: false
---

# 김창환 | DevOps Engineer
---

**저는,**

1. 겸손'하고 '투명'하고 '정직'하고자 합니다.
2. 엔지니어링의 순수한 재미와 성취의 쾌감을 잃지 않고자 합니다.
3. 트레이드 오프와 비용을 고려해 현재의 최선을 찾는 것이 '문제 해결'이라 생각합니다.
4. 뛰어난 엔지니어는, 건강하고 문제 해결을 위한 트레이드 오프를 이해하고 긍정적인 영향력을 발휘하여 비즈니스를 지속적으로 개선시킬 수 있는 엔지니어라 정의합니다.
5. 컴포트 존을 벗어나 현재보다 보다 조금이라도 발전하는 미래를 만들고자 노력합니다.

---

## **주요 관심사**

1. 클라우드 네이티브한 시스템 구축과 컨테이너 및 오케스트레이션 기술에 관심이 많습니다.
2. 안정적이고 확장 가능한 시스템을 만드는데 관심이 많으며 노력하고 있습니다.
3. 무엇이든 측정하고 빠르게 이상 상태를 감지하고 선제 대응할 수 있는 시스템을 만드는데 관심이 많으며 발견된 취약점들을 주도적으로 개선하는데 관심이 많습니다.
4. 어제보다 더 발전되기 위해 '성장하는 방법'에 관심이 많습니다.


---

## **Career**


**Partridge Systems** |                                                                  DevOps Engineer & Part  Lead

> Physical Layer에서 발생하는 대규모 데이터를 실시간으로 수집&가공하여 시각화하는 Data Bahn이란 서비스를 Kubernetes를 활용해 운영하고 있습니다.
> 
1. **On Prem Kubernetes를 도입 및 운영**
    1. 초기 간단하게 Docker로 운영되는 서비스를 Kubernetes로 이식시키는 작업을 주도 하였습니다. 이를 통해 Application Level의 내결함성과 확장성을 확보할 수 있게 되었습니다. 
2. **모니터링&로깅 시스템 구축 및 운영**
    1. 도입 시점 엔지니어링 숙련도와 운영 리소스를 고려해 ELK 스택이 아닌 가벼운 LGTM 기반 스택을 구축하였습니다.
    2. 비즈니스 특성상 Inbound가 허용되지 않는 고객사 환경에 클러스터가 납품되기 때문에 단일진입 지점으로 PUSH할 수 있는 Push Based 아키텍처를 구상했습니다.
    3. Push Fallback 처리가 가능하도록 프로메테우스와 Promtail을 운영하고 있습니다.
3. **Edge Computer 모니터링 시스템 구축**
    1. Opentelmetry를 활용하여 개발자들의 리소스 투입 없이 일렉트론 백엔드 발생하는 지표들을 수집할 수 있는 시스템을 구축하였습니다.
    2. Collector는 내결함성을 가지기 위해 Gateway 패턴을 사용하여 수평 확장 가능한 구조를 만들었습니다. 
    3. Mimir, Loki의 장애를 대비하여 Fallback 옵션을 활성화 하여 끊김없이 100% 수집 가능한 시스템을 만들었습니다.
4. **GKE 기반 Managing Hub 구축**
    1. 여러 고객사의 쿠버네티스 클러스터를 중앙에서 컨트롤할 수 있는 컨트롤 타워를 GKE를 사용해 구축 및 운영하고 있습니다.
    2. Mimir, Loki, GitLab, Harbor, Rancher 등을 활용하여 Inbound가 허용되지 않는 환경의 지표들을 수집해 Grafana를 통해 시각화하고 GitLab을 활용한 GitOps가 가능하게 만들었습니다.
    3. APT Mirror 서버를 구축하여 패키지 미러 서버를 제공합니다.
5. **GKE 비용 최적화**
    1. 수집하고 있는 메트릭들을 사용해 컨테이너들 리소스 Request를 리뷰하고 옵티마이징하여 인프라 비용을 절감하였습니다.
    2. Network Transfer 비용 절감을 위해 단일 AZ 전략을 선택하였습니다. (비교적 HA 중요도가 떨어지기 때문)
6. **일렉트론 애플리케이션 배포 시스템 구축**
    1. 다양한 고객사에 납품되는 다양한 일렉트론 앱을 배포할 수 있는 시스템을 개발하고 구축하여 운영하고 있습니다.
7. **JVM Application 성능 개선 및 **MTTM** 개선**
    1. 4 Golden Signal을 활용해 WAS 처리량과 리소스 사용량들에 대한 이상 지표들을 감지 후 옵티마이징 하였습니다.

---

## **Skills**

1. Linux(중상), AWS(중상), GCP(중), GKE(중), Kubernetes(중상), Helm(상), Grafana(중), Prometheus(중), Mimir(중), Loki(중),
Protail(중), ArgoCD(상), Terraform(중), Ansible(중)
2. Springboot(상), Flask(상)
3. MySQL(중상), Redis(중상), Rabbit MQ(중상)
4. JAVA(상), Kotlin(중상), Python(중상), Go(중), Shell Script(중)
