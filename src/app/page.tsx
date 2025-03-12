import { getAllPosts } from '@/posts'
import { formatDate } from '@/time'
import { createPostUrl } from '@/urls'
import { StyledLink } from './styled-link'

export default async function Home() {
  const posts = await getAllPosts()

  return (
    <ul className="flex flex-col gap-4">
      {posts.map(post => (
        <li key={post.slug}>
          <span className="block">
            <span className="block font-medium">
              <StyledLink href={createPostUrl(post.slug)}>
                {post.title}
              </StyledLink>
            </span>
          </span>

          <time className="block text-sm">{formatDate(post.postedOn)}</time>
        </li>
      ))}
    </ul>
  )
}
