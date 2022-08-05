import { IResolvers } from '@graphql-tools/utils'
import GraphQLDate from 'graphql-date'
// @ts-ignore
import GraphQLLong from 'graphql-type-long'
import { getTokens, addToken, favoriteToken } from '@/services/token'

export const tokenResolver: IResolvers = {
  Query: {
    async getTokens(_: any, args: any) {
      const { where, page, limit } = args

      return await getTokens({ where, page, limit })
    },
  },
  Mutation: {
    async addToken(_: any, args: any) {
      const { contractHash, tokenId } = args
      const token = await addToken(contractHash, tokenId)
      return { token }
    },
    // TODO ADD Authentication
    async favoriteToken(_: any, args: any) {
      // const { slug, tokenId ,publicKey} = args
      const token = await favoriteToken(args)
      return { token }
    },
  },
  GraphQLDate,
  GraphQLLong,
}
