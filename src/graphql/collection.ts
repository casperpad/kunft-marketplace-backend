import { IResolvers } from '@graphql-tools/utils'
import { getCollections, getCollectionSlugs } from '@/services/collection'

export const collectionResolver: IResolvers = {
  Query: {
    async getCollections(_: any, args: any, __: any, ___: any) {
      const { query, page, limit } = args
      return await getCollections(query, page, limit)
    },
    async getCollectionSlugs(_: any, __: any, ___: any, ____: any) {
      const data = await getCollectionSlugs()
      console.log(data)
      return { data }
    },
  },
  Mutation: {
    addCollection: async () => {
      return {}
    },
  },
}
