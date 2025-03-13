import { SyncHighlightFunction } from 'marked-highlight'
import hljs from 'highlight.js'

export const highlight: SyncHighlightFunction = (code, lang) => {
  const { language, filename } = getLangAndFileNameFromLangString(lang)

  const highlighted = hljs.highlight(code, { language }).value
  const highlightedWithLineDivs = addLineDivs(highlighted)

  if (!filename) {
    return highlightedWithLineDivs
  }

  return addFilenameLineDiv(filename, highlightedWithLineDivs)
}

function getLangAndFileNameFromLangString(langString: string) {
  const lang = langString.split('@')[0]
  const filename = langString.split('@')[1]

  return {
    language: hljs.getLanguage(lang) ? lang : 'plaintext',
    filename,
  }
}

function addLineDivs(code: string) {
  return code
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
}

function addFilenameLineDiv(filename: string, code: string) {
  return `<div class="hljs-line hljs-line-filename"><div class="hljs-filename">${filename}</div></div>${code}`
}
