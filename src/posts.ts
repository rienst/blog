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
    headingAnchorExtension,
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

const headingAnchorExtension: MarkedExtension = {
  renderer: {
    heading(token) {
      const escapedText = token.text.toLowerCase().replace(/[^\w]+/g, '-')

      return (
        '<h' +
        token.depth +
        ' class="header"><a name="' +
        escapedText +
        '" class="heading-anchor" href="#' +
        escapedText +
        '"><svg class="heading-anchor-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg></a>' +
        token.text +
        '</h' +
        token.depth +
        '>'
      )
    },
  },
}
