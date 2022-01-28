export type PluginOptions = {
  types?: string[]
  extensions?: string[]
  contentPath?: string
  ignore?: string[]
}

const defaultOptions = {
  types: ['MarkdownRemark'],
  extensions: ['.md']
}

export function resolveOptions (options?: PluginOptions) {
  return { ...defaultOptions, ...options }
}
