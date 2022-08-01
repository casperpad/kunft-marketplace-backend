import { CEP47Client } from 'casper-cep47-js-client'
import { Collection } from '@/models/collection.model'

import {
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
} from '../config'

export const getCollections = async (
  query: string,
  page: number,
  limit: number,
) => {
  const aggregate = Collection.aggregate([
    // {
    //   $search: {
    //     compound: {
    //       must: [
    //         {
    //           text: {
    //             query,
    //             path: 'contractHash',
    //             score: {
    //               boost: {
    //                 value: 9,
    //               },
    //             },
    //           },
    //         },

    //         {
    //           text: {
    //             query,
    //             path: 'name',
    //             fuzzy: { maxEdits: 1, prefixLength: 2 },
    //             score: {
    //               boost: {
    //                 value: 9,
    //               },
    //             },
    //           },
    //         },
    //         {
    //           text: {
    //             query,
    //             path: 'symbol',
    //             fuzzy: { maxEdits: 1, prefixLength: 2 },
    //             score: {
    //               boost: {
    //                 value: 5,
    //               },
    //             },
    //           },
    //         },
    //       ],
    //     },
    //   },
    // },
    {
      $match: {
        slug: query,
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
      },
    },
  ])

  const customLabels = {
    totalDocs: 'total',
    docs: 'collections',
    limit: 'limit',
    page: 'currentPage',
    nextPage: 'nextPage',
    prevPage: 'prevPage',
    totalPages: 'totalPages',
    hasPrevPage: 'hasPrev',
    hasNextPage: 'hasNext',
    pagingCounter: 'pageCounter',
    meta: 'paginationInfo',
  }

  const options = {
    page,
    limit,
    customLabels,
  }

  const result = await Collection.aggregatePaginate(aggregate, options)
  return result
}

export const getCollectionSlugs = async () => {
  const result = await Collection.find().select('slug -_id')
  return result
}

export const addCollection = async (
  contractPackageHash: string,
  contractHash: string,
  verified: boolean,
  promoted: boolean,
  slug?: string,
  image?: string,
  description?: string,
  twitter?: string,
  discord?: string,
  website?: string,
) => {
  const cep47Client = new CEP47Client(
    NEXT_PUBLIC_CASPER_NODE_ADDRESS!,
    NEXT_PUBLIC_CASPER_CHAIN_NAME!,
  )
  cep47Client.setContractHash(`hash-${contractHash}`)
  const name = await cep47Client.name()
  const symbol = await cep47Client.symbol()
  const collectionDB = new Collection({
    contractPackageHash,
    contractHash,
    slug: slug || contractPackageHash,
    name,
    symbol,
    verified,
    promoted,
    image,
    description,
    twitter,
    discord,
    website,
  })
  await collectionDB.save()
  return collectionDB
}
