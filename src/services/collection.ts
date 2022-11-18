import { CEP47Client } from 'casper-cep47-js-client'
import { CasperClient } from 'casper-js-sdk'
import { StatusCodes } from 'http-status-codes'
import { PipelineStage } from 'mongoose'
import 'mongoose-aggregate-paginate-v2'

import {
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
} from '@/config'

import { Collection } from '@/models/collection.model'

import { ApiError } from '@/utils'

import { CollectionDocument } from '@/interfaces/mongoose.gen'
import { getContractHashFromContractPackageHash } from '@/web3/utils'

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

export const getCollections = async ({
  query,
  page = 1,
  limit = 20,
}: {
  query?: string
  page?: number
  limit?: number
}) => {
  const pipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0,
        __v: 0,
      },
    },
  ]
  if (query) {
    pipeline.push({
      $match: {
        slug: query,
      },
    })
  }

  const aggregate = Collection.aggregate(pipeline)

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
  const result = await Collection.find().select('slug contractHash -_id')
  return result
}

export const addCollection = async (
  contractPackageHash: string,
  verified: boolean,
  promoted: boolean,
  slug?: string,
  image?: string,
  description?: string,
  twitter?: string,
  discord?: string,
  website?: string,
): Promise<CollectionDocument> => {
  const cep47Client = new CEP47Client(
    NEXT_PUBLIC_CASPER_NODE_ADDRESS!,
    NEXT_PUBLIC_CASPER_CHAIN_NAME!,
  )
  const casperClient = new CasperClient(NEXT_PUBLIC_CASPER_NODE_ADDRESS)
  const contractHash = await getContractHashFromContractPackageHash(
    casperClient,
    contractPackageHash,
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

export async function getCollectionOrCreate(
  contractPackageHash: string,
): Promise<CollectionDocument> {
  let collectionNFT = await Collection.findOne({ contractPackageHash })
  if (collectionNFT === null) {
    const casperClient = new CasperClient(NEXT_PUBLIC_CASPER_NODE_ADDRESS)
    const stateRootHash = await casperClient.nodeClient.getStateRootHash()
    const { ContractPackage } = await casperClient.nodeClient.getBlockState(
      stateRootHash,
      `hash-${contractPackageHash!}`,
      [],
    )

    const contractHash = ContractPackage?.versions.pop()?.contractHash

    if (!contractHash)
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Invalid Contract Package Hash',
      )
    collectionNFT = await addCollection(contractPackageHash, false, false)
  }
  return collectionNFT
}

type MetadataInfoResponse = { count: number; trait: string }[]

/**
 * Returns trait and its count on given collection
 * @param slug slug of the collection
 * @returns `MetadataInfoResponse`
 */
export const getMetadataInfo = async (slug: string) => {
  const basePipelineStage: PipelineStage[] = [
    {
      $lookup: {
        from: 'tokens',
        localField: '_id',
        foreignField: 'collectionNFT',
        as: 'tokens',
        pipeline: [
          {
            $project: {
              metadata: 1,
              _id: 0,
            },
          },
          {
            $replaceRoot: {
              newRoot: '$metadata',
            },
          },
        ],
      },
    },
    {
      $project: {
        tokens: 1,
        _id: 0,
      },
    },
    {
      $unwind: {
        path: '$tokens',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$tokens',
      },
    },
    {
      $project: {
        x: {
          $objectToArray: '$$CURRENT',
        },
      },
    },
    {
      $unwind: {
        path: '$x',
      },
    },
    {
      $match: {
        'x.k': {
          $ne: '_id',
        },
      },
    },
    {
      $group: {
        _id: '$x.k',
        values: {
          $addToSet: '$x.v',
        },
      },
    },
    {
      $addFields: {
        count: {
          $size: '$values',
        },
      },
    },
    {
      $set: {
        trait: '$_id',
        values: {
          $slice: ['$values', 0, 15],
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]

  const info: MetadataInfoResponse = await Collection.aggregate([
    { $match: { slug } },
    ...basePipelineStage,
  ])
  return info
}
