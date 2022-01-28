import type { Node } from 'gatsby'

/**
 * Adapted from vscode-markdown/src/util.ts
 * https://github.com/yzhang-gh/vscode-markdown/blob/master/src/util.ts
 * via https://github.com/hikerpig/gatsby-project-kb/blob/master/packages/transformer-wiki-references/src/markdown-utils.ts
 */

const SETTEXT_REGEX = /(.*)\n={3,}/

function markdownHeadingToPlainText (text: string) {
  // Remove Markdown syntax (bold, italic, links etc.) in a heading
  // For example: `_italic_` -> `italic`
  return text.replace(/\[([^\]]*)\]\[[^\]]*\]/, (_, g1) => g1)
}

function rxMarkdownHeading (level: number): RegExp {
  const pattern = `^#{${level}}\\s+(.+)$`
  return new RegExp(pattern, 'im')
}

export function findTopLevelHeading (md: string): string | undefined {
  const headingRegex = rxMarkdownHeading(1)
  const headingMatch = headingRegex.exec(md)
  const settextMatch = SETTEXT_REGEX.exec(md)
  let match = headingMatch
  if (settextMatch && (!headingMatch || settextMatch.index < headingMatch.index)) {
    match = settextMatch
  }
  if (match && match.length > 1 && match[1]) {
    return markdownHeadingToPlainText(match[1])
  }

  return undefined
}

export interface MarkdownNode extends Node {
  frontmatter?: {
    title?: string
  }
}

export function getTitle (node: MarkdownNode, content: string) {
  if (
    typeof node.frontmatter === 'object' &&
    node.frontmatter &&
    'title' in node.frontmatter &&
    node.frontmatter.title
  ) {
    return node.frontmatter.title as string
  }
  return findTopLevelHeading(content) || ''
}

const linkTextToSlug = (link: string) => link.toLocaleLowerCase().replaceAll(' ', '-')

function findReferencesUsingPattern (content: string, wikiLinkPattern: RegExp): string[] {
  const matches: string[] = [];
  [...content.matchAll(new RegExp(wikiLinkPattern, 'g'))].forEach((matchArray) => {
    if (matchArray.length > 1 && matchArray[1]) {
      matches.push(matchArray[1])
    }
  })

  return matches.map(linkTextToSlug)
}

export function getOutboundReferences (content: string): string[] {
  const wikiLinkPattern = /\[{2}(.+?)\]{2}/
  return findReferencesUsingPattern(content, wikiLinkPattern)
}
