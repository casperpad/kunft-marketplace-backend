import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import { mergeResolvers } from '@graphql-tools/merge'
import { addResolversToSchema } from '@graphql-tools/schema'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'

import { collectionResolver } from './collection'
import { tokenResolver } from './token'

const schema = loadSchemaSync('./src/graphql/*.gql', {
  loaders: [new GraphQLFileLoader()],
})

const resolvers = mergeResolvers([collectionResolver, tokenResolver])
const config = {
  schema: addResolversToSchema({ schema, resolvers }),
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground({})],
}
export default config
