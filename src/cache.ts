import * as path from 'path'
import type { GatsbyCache, Node } from 'gatsby'
import * as R from 'ramda'

const BRM_CACHE_KEY = '_bidirectionalReferenceMap'

export function getSlugFromNode (node: Node): string {
  if (!node['fileAbsolutePath'] || typeof node['fileAbsolutePath'] !== 'string') {
    throw new Error('no fileAbsolutePath on node')
  }
  const absolutePath = node['fileAbsolutePath']
  const filename = path.basename(absolutePath)
  // TODO handle other file extensions?
  return filename.split('.md')[0] || ''
}

type BidirectionalReferenceMap = {
  inbound: Record<string, string[]>,
  outbound: Record<string, string[]>,
  slugToId: Record<string, string>
}

const emptyBidirectionalReferenceMap = { inbound: {}, outbound: {}, slugToId: {} }

type MarkdownNodeInfo = {
  id: string,
  slug: string,
  outboundReferences: string[]
}

export async function updateBidirectionalReferenceMap (cache: GatsbyCache, currentNodeInfo: MarkdownNodeInfo) {
  const { inbound, outbound, slugToId }: BidirectionalReferenceMap = (await cache.get(BRM_CACHE_KEY)) || emptyBidirectionalReferenceMap
  const { id: currentNodeId, slug: currentNodeSlug, outboundReferences: currentOutboundReferences } = currentNodeInfo

  slugToId[currentNodeSlug] = currentNodeId

  const previousOutboundReferences = outbound[currentNodeSlug] || []
  const removedOutboundReferences = R.difference(previousOutboundReferences, currentOutboundReferences)

  // prune orphaned inbound references if necessary
  removedOutboundReferences.forEach(outboundReference => {
    const inboundReferencesOfTarget = new Set(inbound[outboundReference] || [])
    inboundReferencesOfTarget.delete(currentNodeSlug)
    inbound[outboundReference] = [...inboundReferencesOfTarget]
  })

  // update outbound references
  outbound[currentNodeSlug] = currentOutboundReferences

  // update relevant inbound references
  currentOutboundReferences.forEach(outboundReference => {
    const inboundReferencesOfTarget = new Set(inbound[outboundReference] || [])
    inboundReferencesOfTarget.add(currentNodeSlug)
    inbound[outboundReference] = [...inboundReferencesOfTarget]
  })

  await cache.set(BRM_CACHE_KEY, { inbound, outbound, slugToId })
}

export async function getOutboundReferenceNodes (cache: GatsbyCache, getNode: (id: string) => Node | undefined, currentNodeSlug: string): Promise<(Node | undefined)[]> {
  const { outbound, slugToId }: BidirectionalReferenceMap = (await cache.get(BRM_CACHE_KEY)) || emptyBidirectionalReferenceMap
  const outboundReferenceSlugs = outbound[currentNodeSlug] || []
  const outboundReferenceIds = outboundReferenceSlugs.map((slug: string) => slugToId[slug] || '')
  return Promise.all(outboundReferenceIds.map(getNode))
}

export async function getInboundReferenceNodes (cache: GatsbyCache, getNode: (id: string) => Node | undefined, currentNodeSlug: string): Promise<(Node | undefined)[]> {
  const { inbound, slugToId }: BidirectionalReferenceMap = (await cache.get(BRM_CACHE_KEY)) || emptyBidirectionalReferenceMap
  const inboundReferenceSlugs = inbound[currentNodeSlug] || []
  const inboundReferenceIds = inboundReferenceSlugs.map((slug: string) => slugToId[slug] || '')
  return Promise.all(inboundReferenceIds.map(getNode))
}
