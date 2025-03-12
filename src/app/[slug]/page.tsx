import { getAllPosts, getPost } from '@/posts'
import { formatDate } from '@/time'
import { Title } from '../title'
import { LowProfileLink } from '../low-profile-link'
import { Avatar } from '../avatar'

export const dynamicParams = false

interface Params {
  slug: string
}

interface Props {
  params: Params
}

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getAllPosts()

  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata(props: Promise<Props>) {
  const { params } = await props

  const post = await getPost(params.slug)

  return {
    title: `${post.title} · Rien Stenekes`,
    authors: [
      {
        name: 'Rien Stenekes',
      },
    ],
  }
}

export default async function SinglePost(props: Promise<Props>) {
  const { params } = await props

  const post = await getPost(params.slug)

  return (
    <main className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <Title>{post.title}</Title>

        <p>
          <time dateTime={post.postedOn.toString()}>
            {formatDate(post.postedOn)}
          </time>
        </p>
      </header>

      <div className="md" dangerouslySetInnerHTML={{ __html: post.body }} />

      <div className="flex gap-4 items-center">
        <Avatar />

        <div className="grow">
          <p>Written by Rien Stenekes</p>
          <div className="flex gap-2 flex-wrap text-center text-sm text-gray-500 dark:text-gray-400">
            <LowProfileLink
              href="https://linkedin.com/in/rienstenekes"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </LowProfileLink>
            <span>&middot;</span>
            <LowProfileLink
              href="https://github.com/rienst"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </LowProfileLink>
          </div>
        </div>
      </div>
    </main>
  )
}
