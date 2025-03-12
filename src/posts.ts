import { readFile, readdir } from 'fs/promises'
import matter from 'gray-matter'
import hljs from 'highlight.js'
import { Marked, MarkedExtension } from 'marked'
import { markedHighlight } from 'marked-highlight'

export interface Post {
  title: string
  postedOn: Date
  body: string
  slug: string
}

const postsDirectory = 'src/posts'

export async function getAllPosts() {
  const fileNames = await readdir(postsDirectory)
  const slugs = fileNames.map(fileName => fileName.replace(/\.md$/, ''))

  return await Promise.all(slugs.map(fileName => getPost(fileName)))
}

export async function getPost(slug: string): Promise<Post> {
  const buffer = await readFile(`${postsDirectory}/${slug}.md`)
  const file = matter(buffer)

  const marked = new Marked(
    errorExtension,
    markedHighlight({
      highlight(code, lang) {
        const languageName = lang.split('@')[0]
        const fileName = lang.split('@')[1]

        const language = hljs.getLanguage(languageName)
          ? languageName
          : 'plaintext'
        const highlighted = hljs.highlight(code, { language }).value

        const highlightedWithLines = highlighted
          .split('\n')
          .map(line => {
            const keywordToHighlightMap: Record<string, string> = {
              '+': 'addition',
              '-': 'deletion',
              '!': 'emphasis',
            }

            if (
              line.match(
                new RegExp(
                  `^\\[[${Object.keys(keywordToHighlightMap).join('|\\')}]\\]`,
                  'g'
                )
              )
            ) {
              return `<div class="hljs-line hljs-line-${
                keywordToHighlightMap[line[1]]
              }">${line.slice(3) || '\n'}</div>`
            }

            return `<div class="hljs-line">${line || '\n'}</div>`
          })
          .join('')

        return `${
          fileName
            ? `<div class="hljs-line hljs-line-filename"><div class="hljs-filename">${fileName}</div></div>`
            : ''
        }${highlightedWithLines}`
      },
    })
  )

  return {
    title: file.data.title,
    slug,
    postedOn: new Date(file.data.postedOn),
    body: await marked.parse(file.content),
  }
}

const errorExtension: MarkedExtension = {
  renderer: {
    paragraph(token) {
      const errorRegex = /\[error\]([\s\S]*?)\[\/error\]/g
      const errorMatch = token.text.match(errorRegex)

      if (errorMatch) {
        return `<p class="error">${errorMatch[0].slice(7, -8)}</p>`
      }

      return false
    },
  },
}
