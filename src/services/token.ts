import axios from 'axios'
import { CasperClient } from 'casper-js-sdk'
import { CEP47Client } from 'casper-cep47-js-client'
import { StatusCodes } from 'http-status-codes'
import random from 'lodash/random'
import { ApiError } from '@/utils'
import { Token, Collection, User } from '@/models'
import { MakeServices } from '@/types'
import {
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
} from '../config'
import { addCollection } from './collection'

interface MetadataInput {
  key: string
  values: string[]
}

interface GetTokensInput {
  slug?: string
  owner?: string
  tokenId?: string
  promoted?: boolean
  listed?: boolean
  metadata?: MetadataInput[]
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
  const { slug, owner, promoted, tokenId, listed, metadata } = where
  // let collectionNFTId: string | undefined
  const matchQuery = {} as any
  if (slug || tokenId) {
    const collectionDB = await Collection.findOne({ slug })

    if (collectionDB === null) throw Error(`Not exist ${slug}`)

    matchQuery.collectionNFT = collectionDB._id
    if (tokenId) {
      matchQuery.tokenId = tokenId

      const client = new CEP47Client(
        NEXT_PUBLIC_CASPER_NODE_ADDRESS,
        NEXT_PUBLIC_CASPER_CHAIN_NAME,
      )
      client.setContractHash(`hash-${collectionDB.contractHash}`)

      const owner = await client.getOwnerOf(tokenId)
      await Token.findOneAndUpdate(
        {
          collectionNFT: collectionDB._id,
          tokenId,
        },
        { owner: owner.slice(13) },
      )
    }
  }
  if (promoted) {
    const collectionDBs = await Collection.find({ promoted })
    if (collectionDBs.length > 0) {
      const index = random(0, collectionDBs.length)
      matchQuery.collectionNFT = collectionDBs[index]._id
    }
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
  if (listed !== undefined) {
    matchQuery.listed = listed
  }
  if (metadata) {
    let subQueries: any[] = []
    metadata.forEach((m) => {
      const subQuery: any[] = []
      m.values.forEach((value) => {
        subQuery.push({
          [`metadata.${m.key}`]: value,
        })
      })
      subQueries = subQueries.concat(subQuery)
    })
    matchQuery['$or'] = subQueries
  }

  const aggregate = Token.aggregate([
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
          { $sort: { createdAt: -1 } },
        ],
      },
    },
    {
      $set: {
        listed: {
          $in: ['pending', '$sales.status'],
        },
      },
    },
    {
      $match: {
        ...matchQuery,
      },
    },
    {
      $set: {
        price: {
          $cond: {
            if: {
              $eq: [
                {
                  $size: '$sales',
                },
                0,
              ],
            },
            then: null,
            else: {
              $let: {
                vars: {
                  sale: {
                    $arrayElemAt: ['$sales', 0],
                  },
                },
                in: {
                  price: '$$sale.price',
                  payToken: '$$sale.payToken',
                },
              },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'offers',
        localField: '_id',
        foreignField: 'token',
        as: 'offers',
        pipeline: [
          {
            $project: {
              _id: 0,
              __v: 0,
              token: 0,
            },
          },
          { $sort: { createdAt: -1 } },
        ],
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

/**
 * @deprecated
 * Use _addToken function
 * Add token by `contractHash` and `tokenId`
 * @param contractHash CEP47 contract hash
 * @param tokenId token id
 * @returns Token
 */
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

/**
 * Favorite given token and returns updated token
 * @param slug Identifier of collection
 * @param tokenId token id
 * @param publicKey favorited user public key
 * @returns Token
 */
export const favoriteToken = async (
  slug: string,
  tokenId: string,
  publicKey: string,
) => {
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

export const addUserToken = async (accountHash: string) => {
  let page = 1
  const limit = 10
  let added = 0
  do {
    const { data } = await axios.get<MakeServices.TokensByOwnerResponse>(
      `https://event-store-api-clarity-testnet.make.services/accounts/${accountHash}/nft-tokens?fields=contract_package&page=${page}&limit=${limit}`,
    )

    const promises = data.data.map(async (token) => {
      const metadata = {} as any
      token.metadata.forEach((meta) => {
        metadata[meta.key] = meta.value
      })
      const result = await _addToken(
        token.contract_package_hash,
        token.token_id,
        metadata,
        token.owner_account_hash,
      )
      return result
    })
    const result = await Promise.all(promises)
    added += result.filter((r) => r).length
    if (data.pageCount === page) break
    page += 1
    // eslint-disable-next-line no-constant-condition
  } while (true)
  return added
}

const _addToken = async (
  contractPackageHash: string,
  tokenId: string,
  metadata: any,
  owner: string,
): Promise<boolean> => {
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
    if (!contractHash) return false
    collectionNFT = await addCollection(
      contractPackageHash,
      contractHash,
      false,
      false,
    )
  }

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

  return true
}
