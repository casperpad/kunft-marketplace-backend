import { IResolvers } from '@graphql-tools/utils'
import { getCollections, getCollectionSlugs } from '@/services/collection'

export const collectionResolver: IResolvers = {
  Query: {
    async getCollections(_, args, __, ___) {
      const { query, page, limit } = args
      return await getCollections(query, page, limit)
    },
    async getCollectionSlugs(_, __, ___, ____) {
      const slugs = await getCollectionSlugs()
      return { slugs }
    },
  },
  Mutation: {
    addCollection: async () => {
      return {}
    },
  },
}
