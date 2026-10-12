import * as React from 'react'
import type { PageProps } from 'gatsby'
import { PageWrapper } from '../components/page-wrapper'
import { graphql, Link } from 'gatsby'
import { useSiteMetadata } from '../use-site-metadata'

export default function Index(props: PageProps<any>) {
  const pages: Page[] = props.data.allMarkdownRemark.edges.map(
    (edge: any) => edge.node.frontmatter,
  )

  return (
    <PageWrapper>
      <ul>
        {pages.map(page => (
          <li>
            <Link
              to={page.slug}
              className="underline underline-offset-3 text-blue-600 dark:text-blue-400"
            >
              {page.title} — {page.date}
            </Link>
          </li>
        ))}
      </ul>
    </PageWrapper>
  )
}

export function Head() {
  return <title>{useSiteMetadata().title}</title>
}

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
