import { IResolvers } from '@graphql-tools/utils'
import { getCollections, getCollectionSlugs } from '@/services/collection'

export const collectionResolver: IResolvers = {
  Query: {
    async getCollections(_: any, args: any, __: any, ___: any) {
      return await getCollections(args)
    },
    async getCollectionSlugs(_: any, __: any, ___: any, ____: any) {
      const data = await getCollectionSlugs()

      return { data }
    },
  },
  Mutation: {
    addCollection: async () => {
      return {}
    },
  },
}
