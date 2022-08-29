/* eslint-disable @typescript-eslint/no-non-null-assertion */
import retry from 'async-retry'
import { CEP47Client } from 'casper-cep47-js-client'
import {
  CasperClient,
  CLMap,
  CLString,
  CLValueBuilder,
  EventName,
  EventStream,
} from 'casper-js-sdk'
import { Collection, Offer, Token } from '@/models'
import {
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS,
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH,
} from '@/config'
import { MarketplaceEventParser, MarketplaceEvents } from '../marketplace'
import { Casper } from '@/models'
import { addCollection } from '@/services/collection'
import { getContractPackageHashFromContractHash } from '../utils'
import { saleServices } from '@/services'

export const _startMarketplaceEventStream = async () => {
  try {
    console.info(`Starting Marketplace event listener`)
    const es = new EventStream(NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS!)
    const contractPackageHash = NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH!

    es.subscribe(EventName.DeployProcessed, async (events) => {
      const parsedEvents = MarketplaceEventParser(
        {
          contractPackageHash: contractPackageHash.slice(5),
          eventNames: [
            MarketplaceEvents.SellOrderCreated,
            MarketplaceEvents.SellOrderCanceled,
            MarketplaceEvents.SellOrderBought,
            MarketplaceEvents.BuyOrderCreated,
            MarketplaceEvents.BuyOrderCanceled,
            MarketplaceEvents.BuyOrderAccepted,
          ],
        },
        events,
      )
      try {
        if (parsedEvents && parsedEvents.success) {
          console.info('***  MARKETPLACE EVENT  ***')

          const promises = parsedEvents.data.map(async (event: any) => {
            const eventName = event.name as MarketplaceEvents
            const deployHash = event.deployHash as string
            const eventParams: CLMap<CLString, CLString> = event.clValue
            console.info(`Handling ${eventName} event`)
            const creator = eventParams.get(CLValueBuilder.string('creator'))
            const collection = eventParams.get(
              CLValueBuilder.string('collection'),
            )
            const tokenId = eventParams.get(CLValueBuilder.string('token_id'))
            const payToken = eventParams.get(CLValueBuilder.string('pay_token'))
            const price = eventParams.get(CLValueBuilder.string('price'))
            const startTime = eventParams.get(
              CLValueBuilder.string('start_time'),
            )
            const buyer = eventParams.get(CLValueBuilder.string('buyer'))
            const owner = eventParams.get(CLValueBuilder.string('owner'))
            const additionalRecipient = eventParams.get(
              CLValueBuilder.string('additional_recipient'),
            )

            const cep47Client = new CEP47Client(
              NEXT_PUBLIC_CASPER_NODE_ADDRESS!,
              NEXT_PUBLIC_CASPER_CHAIN_NAME!,
            )
            let collectionDB = await Collection.findOne({
              contractHash: collection!.value(),
            })
            if (collectionDB === null) {
              const casperClient = new CasperClient(
                NEXT_PUBLIC_CASPER_NODE_ADDRESS,
              )
              const contractPackageHash =
                await getContractPackageHashFromContractHash(
                  casperClient,
                  collection!.value(),
                )
              collectionDB = await addCollection(
                contractPackageHash,
                false,
                false,
              )
            }
            cep47Client.setContractHash(`hash-${collection!.value()}`)
            const token_owner = await cep47Client.getOwnerOf(tokenId!.value())
            let token = await Token.findOneAndUpdate(
              {
                collectionNFT: collectionDB,
                tokenId: tokenId!.value(),
              },
              { owner: token_owner.slice(13) },
              { new: true },
            )
            if (token === null) {
              console.info(`Adding ${collectionDB.name} #${tokenId!.value()}`)
              const tokenMeta: Map<string, string> =
                await cep47Client.getTokenMeta(tokenId!.value())
              const metadata = Array.from(tokenMeta.entries()).map((t) => {
                return {
                  key: t[0],
                  value: t[1],
                }
              })
              token = new Token({
                collectionNFT: collectionDB,
                tokenId: tokenId!.value(),
                owner: token_owner.slice(13),
                metadata,
              })
              await token.save()
            }
            let formatedCreatorHash = creator!.value()
            formatedCreatorHash = formatedCreatorHash.slice(20).slice(0, -2)
            // formatedCreatorHash = `account-hash-${formatedCreatorHash}`
            switch (eventName) {
              case MarketplaceEvents.SellOrderCreated: {
                const preferPayToken =
                  payToken!.value() === 'None'
                    ? undefined
                    : payToken!.value().slice(18).slice(0, -2)
                await saleServices.onTokenListed(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  price!.value(),
                  deployHash,
                  preferPayToken,
                )

                break
              }
              case MarketplaceEvents.SellOrderCanceled:
                await saleServices.onCancelListing(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  deployHash,
                )
                break
              case MarketplaceEvents.SellOrderBought: {
                const formattedbuyer = buyer!.value().slice(20).slice(0, -2)
                const preferAdditionalRecipient =
                  additionalRecipient && additionalRecipient.value() !== 'None'
                    ? additionalRecipient.value()
                    : undefined
                await saleServices.onBuyListedToken(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  formattedbuyer,
                  deployHash,
                  preferAdditionalRecipient,
                )
                break
              }

              case MarketplaceEvents.BuyOrderCreated: {
                const buyOrder = new Offer({
                  creator: formatedCreatorHash,
                  token,
                  owner: token.owner,
                  payToken:
                    payToken!.value() === 'None'
                      ? undefined
                      : payToken!.value(),
                  price: price!.value(),
                  startTime: startTime!.value(),
                  additionalRecipient:
                    additionalRecipient!.value() === 'None'
                      ? undefined
                      : additionalRecipient!.value(),
                  status: 'pending',
                })
                await buyOrder.save()
                break
              }
              case MarketplaceEvents.BuyOrderCanceled: {
                Offer.findOneAndUpdate(
                  {
                    creator: formatedCreatorHash,
                    token,
                    startTime: startTime!.value(),
                  },
                  {
                    status: 'canceled',
                  },
                )
                break
              }
              case MarketplaceEvents.BuyOrderAccepted: {
                await Offer.findOneAndUpdate(
                  {
                    creator: formatedCreatorHash,
                    token,
                    startTime: startTime!.value(),
                  },
                  {
                    owner: owner!.value(),
                    status: 'succeed',
                  },
                )
                token.owner = formatedCreatorHash
                await token.save()
                break
              }
              default:
                console.error(`Unhandled event: ${eventName}`)
            }
          })
          await Promise.all(promises)
          console.info('***     ***')
        }
        const consumed_event = new Casper({ lasteEventId: events.id })
        await consumed_event.save()
      } catch (err: any) {
        console.error(`***Marketplace EventStream Error***`)
        console.error(err)
        console.error(`*** ***`)
      }
    })
    const consumedEvent = await Casper.find()
      .sort({ createdAt: 'desc' })
      .limit(1)
    if (consumedEvent.length === 1) {
      console.info(`Start Event listener from ${consumedEvent[0].lasteEventId}`)
      es.start(consumedEvent[0].lasteEventId)
    } else es.start()
  } catch (error: any) {
    console.error(error)
  }
}

export const startMarketplaceEventStream = async () => {
  //
  await retry(_startMarketplaceEventStream, {
    retries: 10,
    minTimeout: 200000,
    onRetry(e, attempt) {
      console.log(e, attempt)
    },
  })
}
