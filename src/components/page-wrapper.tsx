import { Link } from 'gatsby'
import * as React from 'react'
import { useSiteMetadata } from '../use-site-metadata'

export function PageWrapper(props: React.PropsWithChildren) {
  return (
    <div className="py-8 px-4 max-w-3xl mx-auto sm:px-8 md:py-16">
      <header className="pb-8 md:pb-16">
        <Link
          to="/"
          className="font-medium text-xl md:text-2xl hover:underline"
        >
          {useSiteMetadata().title}
        </Link>
      </header>
      <main>{props.children}</main>
    </div>
  )
}
