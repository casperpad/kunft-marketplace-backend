import { IResolvers } from '@graphql-tools/utils'
import GraphQLDate from 'graphql-date'
// @ts-ignore
import GraphQLLong from 'graphql-type-long'
import { getTokens, addToken } from '@/services/token'

export const tokenResolver: IResolvers = {
  Query: {
    async getTokens(_: any, args: any) {
      const { where, page, limit } = args
      console.log(args)
      return await getTokens({ where, page, limit })
    },
  },
  Mutation: {
    async addToken(_: any, args: any) {
      const { contractPackageHash, contractHash, tokenId } = args
      return await addToken(contractPackageHash, contractHash, tokenId)
    },
  },
  GraphQLDate,
  GraphQLLong,
}
