import { CEP47Client } from 'casper-cep47-js-client'
import { StatusCodes } from 'http-status-codes'
import { Token, Collection } from '@/models'

import {
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
} from '../config'
import { addCollection } from './collection'
import { CasperClient } from 'casper-js-sdk'
import { ApiError } from '@/utils'

interface GetTokensInput {
  slug?: string
  owner?: string
  tokenId?: string
}

export const getTokens = async ({
  where,
  page = 1,
  limit = 20,
}: {
  where: GetTokensInput
  page?: number
  limit?: number
}) => {
  const { slug, owner, tokenId } = where
  // let collectionNFTId: string | undefined
  const matchQuery = {} as any
  if (slug) {
    const collectionDB = await Collection.findOne({ slug })

    if (collectionDB === null) throw Error(`Not exist ${slug}`)

    matchQuery.collectionNFT = collectionDB._id
  }
  if (owner) {
    matchQuery.owner = owner
  }
  if (tokenId) {
    matchQuery.tokenId = tokenId
  }
  console.log({
    $match: {
      ...matchQuery,
    },
  })
  const aggregate = Token.aggregate([
    {
      $match: {
        ...matchQuery,
      },
    },
    {
      $lookup: {
        from: 'collections',
        localField: 'collectionNFT',
        foreignField: '_id',
        as: 'collection',
        pipeline: [
          {
            $project: {
              _id: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $set: {
        collection: { $first: '$collection' },
      },
    },
    {
      $lookup: {
        from: 'sales',
        localField: '_id',
        foreignField: 'token',
        as: 'sales',
        pipeline: [
          {
            $project: {
              _id: 0,
              __v: 0,
              token: 0,
            },
          },
        ],
      },
    },
    {
      $set: {
        price: '1000000',
      },
    },
    {
      $addFields: {
        listed: {
          $eq: [
            {
              $let: {
                vars: {
                  sales: '$sales',
                },
                in: '$$sales.status',
              },
            },
            'pending',
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
        collectionNFT: 0,
      },
    },
  ])

  const customLabels = {
    totalDocs: 'total',
    docs: 'tokens',
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

  const result = await Token.aggregatePaginate(aggregate, options)

  return result
}

export const addToken = async (contractHash: string, tokenId: string) => {
  const casperClient = new CasperClient(NEXT_PUBLIC_CASPER_NODE_ADDRESS)
  const stateRootHash = await casperClient.nodeClient.getStateRootHash()
  const { Contract } = await casperClient.nodeClient.getBlockState(
    stateRootHash,
    `hash-${contractHash!}`,
    [],
  )
  const contractPackageHash = Contract?.contractPackageHash.slice(21)

  if (!contractPackageHash)
    throw new ApiError(StatusCodes.NOT_FOUND, `Not found contractPackageHash`)

  let collectionNFT = await Collection.findOne({ contractPackageHash })
  if (collectionNFT === null) {
    collectionNFT = await addCollection(
      contractPackageHash,
      contractHash,
      false,
      false,
    )
  }

  const cep47Client = new CEP47Client(
    NEXT_PUBLIC_CASPER_NODE_ADDRESS!,
    NEXT_PUBLIC_CASPER_CHAIN_NAME!,
  )
  cep47Client.setContractHash(`hash-${contractHash}`)
  const metadata = await cep47Client.getTokenMeta(tokenId)
  const owner = (await cep47Client.getOwnerOf(tokenId)).slice(13)
  const token = await Token.findOneAndUpdate(
    { collectionNFT, tokenId },
    {
      collectionNFT,
      tokenId,
      metadata,
      owner,
    },
    {
      upsert: true,
    },
  )

  console.log(token)

  return token
}
