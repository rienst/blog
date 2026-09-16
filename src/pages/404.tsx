import * as React from 'react'
import { HeadFC, PageProps } from 'gatsby'
import { PageWrapper } from '../components/page-wrapper'
import { Title } from '../components/title'

const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <PageWrapper>
      <Title>Page not found</Title>
    </PageWrapper>
  )
}

export default NotFoundPage

export const Head: HeadFC = () => <title>Not found</title>
