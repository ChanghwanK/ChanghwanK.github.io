import * as React from "react"
import ThemeToggle from "./theme-toggle"
import * as styles from "./layout.module.css"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => (
  <>
    <div className={styles.themeToggleBar}>
      <ThemeToggle />
    </div>
    <main>{children}</main>
  </>
)

export default Layout
