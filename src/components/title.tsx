import { Link } from 'gatsby'
import * as React from 'react'

export function Title(props: React.PropsWithChildren) {
  return (
    <h1 className="font-medium text-3xl mb-1 md:text-4xl">{props.children}</h1>
  )
}
