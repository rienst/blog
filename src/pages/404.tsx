import * as React from 'react'
import { PageWrapper } from '../components/page-wrapper'
import { Title } from '../components/title'

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <Title>This page does not exist</Title>
    </PageWrapper>
  )
}

export function Head() {
  return <title>Page not found</title>
}
