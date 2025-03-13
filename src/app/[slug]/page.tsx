import { getAllPosts, getPost } from '@/posts'
import { formatDate } from '@/time'
import { Title } from '../title'
import { LowProfileLink } from '../low-profile-link'
import { Avatar } from '../avatar'
import { info } from '@/info'
import { StyledLink } from '../styled-link'

export const dynamicParams = false

interface Params {
  slug: string
}

interface Props {
  params: Promise<Params>
}

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getAllPosts()

  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata(props: Props) {
  const params = await props.params

  const post = await getPost(params.slug)

  return {
    title: `${post.title} · ${info.name}`,
    authors: [
      {
        name: info.name,
      },
    ],
  }
}

export default async function SinglePost(props: Props) {
  const params = await props.params

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
          <p>Written by {info.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {info.description}
          </p>
        </div>
      </div>
    </main>
  )
}
