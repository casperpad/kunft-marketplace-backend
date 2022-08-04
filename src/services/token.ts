import axios from 'axios'
import { CasperClient } from 'casper-js-sdk'
import { CEP47Client } from 'casper-cep47-js-client'
import { StatusCodes } from 'http-status-codes'
import { ApiError } from '@/utils'
import { Token, Collection, User } from '@/models'
import { MakeServices } from '@/types'
import {
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
} from '../config'
import { addCollection } from './collection'

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

    // let page = 1
    // const limit = 10
    // do {
    //   const { data } = await axios.get<MakeServices.TokensByOwnerResponse>(
    //     `https://event-store-api-clarity-testnet.make.services/accounts/2642243a3ca1abc6f1b5ad3c9f53114955533ffe1a9e76055d1f987370d1d8e0/nft-tokens?fields=contract_package&page=${page}&limit=${limit}`,
    //   )
    //   if (data.pageCount === page) break
    //   page += 1
    // } while (true)
    //
  }
  if (tokenId) {
    matchQuery.tokenId = tokenId
  }

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
        pendingSale: {
          $let: {
            vars: {
              pendingSales: {
                $filter: {
                  input: '$sales',
                  as: 'sale',
                  cond: { $eq: ['$$sale.status', 'pending'] },
                },
              },
            },
            in: {
              $cond: {
                if: { $eq: [{ $size: '$$pendingSales' }, 0] },
                then: null,
                else: { $arrayElemAt: ['$$pendingSales', 0] },
              },
            },
          },
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
  await Token.findOneAndUpdate(
    { collectionNFT, tokenId },
    {
      collectionNFT,
      tokenId,
      metadata,
      owner,
    },
    {
      upsert: true,
      new: true,
    },
  )
  const token = (
    (await getTokens({ where: { slug: collectionNFT.slug, tokenId } })) as any
  ).tokens[0]
  return token
}

export const favoriteToken = async ({
  slug,
  tokenId,
  publicKey,
}: {
  slug: string
  tokenId: string
  publicKey: string
}) => {
  const collectionNFT = await Collection.findOne({ slug })

  if (collectionNFT === null) throw Error(`Not exist ${slug}`)

  let token = await Token.findOne({ collectionNFT, tokenId })

  const user = await User.findOne({ publicKey })

  if (
    token.favoritedUsers.find((u: any) => u.toString() === user._id.toString())
  )
    token.favoritedUsers = token.favoritedUsers.filter(
      (u: any) => u.toString() !== user._id.toString(),
    )
  else token.favoritedUsers.push(user._id)

  await token.save()

  token = ((await getTokens({ where: { slug, tokenId } })) as any).tokens[0]
  return token
}
