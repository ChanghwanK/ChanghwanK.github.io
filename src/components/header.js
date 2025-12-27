import * as React from "react"
import { Link } from "gatsby"

const Header = ({ siteTitle }) => (
  <header
    style={{
      margin: `0 auto`,
      padding: `1.5rem 2rem`,
      display: `flex`,
      alignItems: `center`,
      justifyContent: `space-between`,
      borderBottom: `1px solid #f0f0f0`,
    }}
  >
    <Link
      to="/"
      style={{
        fontSize: `1rem`,
        textDecoration: `none`,
        color: `#333`,
        fontWeight: `400`,
      }}
    >
      {siteTitle}
    </Link>

    <nav style={{ display: 'flex', gap: '2rem' }}>
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          color: '#666',
          fontSize: '0.95rem',
        }}
        activeStyle={{ color: '#333', fontWeight: '500' }}
      >
        글
      </Link>
      <Link
        to="/log"
        style={{
          textDecoration: 'none',
          color: '#666',
          fontSize: '0.95rem',
        }}
        activeStyle={{ color: '#333', fontWeight: '500' }}
      >
        로그
      </Link>
    </nav>
  </header>
)

export default Header