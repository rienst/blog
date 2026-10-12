import * as React from 'react'
import { graphql, HeadProps, PageProps } from 'gatsby'
import { PageWrapper } from '../components/page-wrapper'
import { Title } from '../components/title'

export default function BlogPostTemplate(props: PageProps<any>) {
  const page: Page = props.data.markdownRemark
  return (
    <PageWrapper>
      <div className="pb-8">
        <Title>{page.frontmatter.title}</Title>
        <p>{page.frontmatter.date}</p>
      </div>
      <div
        className="plain-html"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </PageWrapper>
  )
}

export function Head(props: HeadProps<any>) {
  const page: Page = props.data.markdownRemark
  return <title>{page.frontmatter.title}</title>
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
