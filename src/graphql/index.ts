import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import { mergeResolvers } from '@graphql-tools/merge'
import { addResolversToSchema } from '@graphql-tools/schema'
import { applyMiddleware } from 'graphql-middleware'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { ApolloServerExpressConfig } from 'apollo-server-express'

import { JWT_NAME } from '@/config'
import { collectionResolver } from './collection'
import { tokenResolver } from './token'
import { decodeJwtToken } from '@/services/auth'
import permissions from './permissions'

const schema = applyMiddleware(
  loadSchemaSync('./src/graphql/*.gql', {
    loaders: [new GraphQLFileLoader()],
  }),
  permissions,
)

const resolvers = mergeResolvers([collectionResolver, tokenResolver])
const config: ApolloServerExpressConfig = {
  schema: addResolversToSchema({ schema, resolvers }),
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground({})],

  context: ({ req }) => {
    try {
      // Note: This example uses the `req` argument to access headers,
      // but the arguments received by `context` vary by integration.
      // This means they vary for Express, Koa, Lambda, etc.
      //
      // To find out the correct arguments for a specific integration,
      // see https://www.apollographql.com/docs/apollo-server/api/apollo-server/#middleware-specific-context-fields

      // Get the user token from the headers.
      const token = req.cookies[JWT_NAME]
      if (token) {
        // Try to retrieve a user with the token

        const user = decodeJwtToken(token)
        // Add the user to the context
        return { ...req, user }
      }
      return { ...req, user: null }
    } catch (error: any) {
      return { ...req, user: null }
    }
  },
}
export default config
