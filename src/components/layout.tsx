import * as React from "react"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => <main>{children}</main>

export default Layout
