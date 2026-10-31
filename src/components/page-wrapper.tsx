import { Link } from 'gatsby'
import * as React from 'react'
import { useSiteMetadata } from '../use-site-metadata'

export function PageWrapper(props: React.PropsWithChildren) {
  return (
    <>
      <header className="navbar border-bottom bg-0">
        <div className="container">
          <Link to="/" className="navbar-brand">
            {useSiteMetadata().title}
          </Link>
        </div>
      </header>
      <main className="container py-12">{props.children}</main>
    </>
  )
}
