import * as React from 'react'
import type { HeadFC, PageProps } from 'gatsby'
import { PageWrapper } from '../components/page-wrapper'
import { graphql, Link } from 'gatsby'

export default function Index(props: PageProps<any>) {
  const pages: Page[] = props.data.allMarkdownRemark.edges.map(
    (edge: any) => edge.node.frontmatter,
  )

  return (
    <PageWrapper>
      <ul>
        {pages.map(page => (
          <li>
            <Link to={page.slug}>
              {page.title} - {page.date}
            </Link>
          </li>
        ))}
      </ul>
    </PageWrapper>
  )
}

export const Head: HeadFC = () => <title>Home Page</title>

export const pageQuery = graphql`
  query {
    allMarkdownRemark {
      edges {
        node {
          frontmatter {
            title
            date(formatString: "MMMM DD, YYYY")
            slug
          }
        }
      }
    }
  }
`

interface Page {
  title: string
  date: string
  slug: string
}
