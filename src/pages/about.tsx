/* src/pages/about.tsx */
import * as React from "react"
import { Link } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./about.module.css"

const AboutPage = () => (
  <Layout hideHeader>
    <div className={styles.darkPage}>
      <div className={styles.container}>
        <nav className={styles.pageNav} aria-label="브레드크럼">
          <Link to="/" className={styles.navHome}>김창환</Link>
          <span className={styles.navSep}>/</span>
          <span className={styles.navCurrent}>About Me</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.title}>About Me</h1>
          <p className={styles.subtitle}>DevOps Engineer</p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>소개</h2>
          <p className={styles.text}>
            Kubernetes와 클라우드 네이티브 환경에서, 개발팀이 더 빠르고 안전하게
            제품을 만들 수 있는 플랫폼을 설계합니다.
          </p>
          <p className={styles.text}>
            시스템의 동작 원리를 이해하고 반복되는 운영 문제를 자동화하는 DevOps
            Engineer입니다.
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
            기술적인 이야기나 협업 제안은 언제든 환영합니다.
          </p>
          <p className={styles.text}>
            <a
              href="https://www.linkedin.com/in/changhwan-kim-767139219/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </p>
        </section>
      </div>
    </div>
  </Layout>
)

export const Head = () => <Seo title="About Me" />

export default AboutPage
