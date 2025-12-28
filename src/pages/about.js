/* src/pages/about.js */
import * as React from "react"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./about.module.css"

const AboutPage = () => (
    <Layout>
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>About Me</h1>
                <p className={styles.subtitle}>DevOps & Platform Engineer</p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>소개</h2>
                <p className={styles.text}>
                    안녕하세요! 안정적이고 확장 가능한 인프라를 구축하는 것에 열정을 가진 엔지니어입니다.
                    클라우드 네이티브 기술을 활용하여 개발 생산성을 높이고, 운영 효율화를 고민하는 과정을 즐깁니다.
                </p>
                <p className={styles.text}>
                    단순히 도구를 사용하는 것을 넘어, '왜'라는 질문을 던지며 시스템의 본질적인 문제를 해결하고자 노력합니다.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tech Stack</h2>
                <ul className={styles.skillList}>
                    <li className={styles.skillItem}>Kubernetes</li>
                    <li className={styles.skillItem}>AWS / GCP</li>
                    <li className={styles.skillItem}>Terraform</li>
                    <li className={styles.skillItem}>CI/CD (GitHub Actions)</li>
                    <li className={styles.skillItem}>Golang / Python</li>
                    <li className={styles.skillItem}>Prometheus / Grafana</li>
                </ul>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Contact</h2>
                <p className={styles.text}>
                    기술적인 이야기나 협업 제안은 언제든 환영합니다.<br />
                    Email: example@email.com
                </p>
            </section>
        </div>
    </Layout>
)

export const Head = () => <Seo title="About Me" />

export default AboutPage