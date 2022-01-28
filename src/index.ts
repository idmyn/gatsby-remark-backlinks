import type {
  Node,
  CreateNodeArgs,
  SetFieldsOnGraphQLNodeTypeArgs
} from 'gatsby'
import { PluginOptions, resolveOptions } from './options'
import { getSlugFromNode, updateBidirectionalReferenceMap, getInboundReferenceNodes, getOutboundReferenceNodes } from './cache'
import { getTitle, MarkdownNode, getOutboundReferences } from './markdown'

export async function onCreateNode (
  { cache, node, loadNodeContent, actions }: CreateNodeArgs,
  _options?: PluginOptions
) {
  const options = resolveOptions(_options)
  // if we shouldn't process this node, then return
  if (!options.types.includes(node.internal.type)) {
    return
  }
  const slug = getSlugFromNode(node)
  const content = await loadNodeContent(node)
  const title = getTitle(node as MarkdownNode, content)
  const outboundReferences = getOutboundReferences(content)

  actions.createNodeField({
    node,
    name: 'title',
    value: title
  })

  const nodeInfo = { id: node.id, slug, outboundReferences }

  await updateBidirectionalReferenceMap(cache, nodeInfo)
}

export const setFieldsOnGraphQLNodeType = (
  { cache, type, getNode }: SetFieldsOnGraphQLNodeTypeArgs,
  _options?: PluginOptions
) => {
  const options = resolveOptions(_options)
  // if we shouldn't process this node, then return
  if (!options.types.includes(type.name)) {
    return {}
  }

  return {
    outboundReferences: {
      type: `[${type.name}!]!`,
      resolve: (node: Node) => {
        const currentNodeSlug = getSlugFromNode(node)
        return getOutboundReferenceNodes(cache, getNode, currentNodeSlug)
      }
    },
    inboundReferences: {
      type: `[${type.name}!]!`,
      resolve: (node: Node) => {
        const currentNodeSlug = getSlugFromNode(node)
        return getInboundReferenceNodes(cache, getNode, currentNodeSlug)
      }
    }
  }
}
