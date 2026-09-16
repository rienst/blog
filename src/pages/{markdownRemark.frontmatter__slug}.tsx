import * as React from 'react'
import { graphql, PageProps } from 'gatsby'
import { PageWrapper } from '../components/page-wrapper'
import { Title } from '../components/title'

export default function BlogPostTemplate(props: PageProps<any>) {
  const page: Page = props.data.markdownRemark
  return (
    <PageWrapper>
      <Title>{page.frontmatter.title}</Title>
      <p className="text-sm text-neutral-500 mb-4 dark:text-neutral-400">
        {page.frontmatter.date}
      </p>
      <div
        className="plain-html"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </PageWrapper>
  )
}

export const pageQuery = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        title
      }
    }
  }
`

interface Page {
  frontmatter: {
    title: string
    date: string
  }
  html: string
}
