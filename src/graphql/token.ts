import { IResolvers } from '@graphql-tools/utils'
import GraphQLDate from 'graphql-date'
// @ts-ignore
import GraphQLLong from 'graphql-type-long'
import { getTokens } from '@/services/token'

export const tokenResolver: IResolvers = {
  Query: {
    async getTokens(_: any, args: any, __: any, ___: any) {
      const { where, page, limit } = args
      return await getTokens({ where, page, limit })
    },
  },
  GraphQLDate,
  GraphQLLong,
}
