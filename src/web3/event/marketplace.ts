/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CEP47Client } from 'casper-cep47-js-client'
import {
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
} from '../../config'
import { Sale } from '../../models/sale.model'
import { MarketplaceEventParser, MarketplaceEvents } from '../marketplace'

// const privateKey = Keys.Ed25519.parsePrivateKeyFile(
//   `${MASTER_KEY_PAIR_PATH}/secret_key.pem`,
// )
// const publicKey = Keys.Ed25519.privateToPublicKey(privateKey)

// const KEYS = Keys.Ed25519.parseKeyPair(publicKey, privateKey)

export const startMarketplaceEventStream = async () => {
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
          const eventParams: CLMap<CLString, CLString> = event.clValue
          console.info(`Handling ${eventName} event`)
          const creator = eventParams.get(CLValueBuilder.string('creator'))
          const collection = eventParams.get(
            CLValueBuilder.string('collection'),
          )
          const tokenId = eventParams.get(CLValueBuilder.string('token_id'))
          const payToken = eventParams.get(CLValueBuilder.string('pay_token'))
          const price = eventParams.get(CLValueBuilder.string('price'))
          const startTime = eventParams.get(CLValueBuilder.string('start_time'))
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
            const name = await cep47Client.name()
            console.info(
              `Creating ${name} collection for ${collection!.value()} contract hash.`,
            )
            const symbol = await cep47Client.symbol()
            collectionDB = new Collection({
              contractHash: collection!.value(),
              slug: collection!.value(),
              name,
              symbol,
              verified: false,
            })
            await collectionDB.save()
          }
          cep47Client.setContractHash(`hash-${collection!.value()}`)

          let token = await Token.findOne({
            collectionNFT: collectionDB,
            tokenId: tokenId!.value(),
          })
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
              metadata,
            })
            await token.save()
          }
          let formatedCreatorHash = creator!.value()
          formatedCreatorHash = formatedCreatorHash.slice(20).slice(0, -2)
          formatedCreatorHash = `account-hash-${formatedCreatorHash}`
          switch (eventName) {
            case MarketplaceEvents.SellOrderCreated: {
              const order = await Sale.findOne({
                creator: formatedCreatorHash,
                token,
                startTime: startTime!.value(),
              })
              if (order) break
              const sellOrder = new Sale({
                creator: formatedCreatorHash,
                token,
                payToken:
                  payToken!.value() === 'None' ? undefined : payToken!.value(),
                price: price!.value(),
                startTime: startTime!.value(),
                status: 'pending',
              })
              await sellOrder.save()
              break
            }
            case MarketplaceEvents.SellOrderCanceled:
              await Sale.findOneAndUpdate(
                {
                  creator: formatedCreatorHash,
                  token,
                  startTime: startTime!.value(),
                },
                { status: 'canceled' },
              )
              break
            case MarketplaceEvents.SellOrderBought:
              await Sale.findOneAndUpdate(
                {
                  creator: formatedCreatorHash,
                  token,
                  startTime: startTime!.value(),
                },
                {
                  buyer: buyer!.value(),
                  additionalRecipient: additionalRecipient!.value(),
                  status: 'succed',
                },
              )
              break

            case MarketplaceEvents.BuyOrderCreated: {
              const buyOrder = new Offer({
                creator: formatedCreatorHash,
                token,
                payToken: payToken!.value(),
                price: price!.value(),
                startTime: startTime!.value(),
                additionalRecipient: additionalRecipient!.value(),
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
              Offer.findOneAndUpdate(
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
              break
            }
            default:
              console.error(`Unhandled event: ${eventName}`)
          }
        })
        await Promise.all(promises)
        console.info('***     ***')
      }
    } catch (err: any) {
      console.error(`***Marketplace EventStream Error***`)
      console.error(err)
      console.error(`*** ***`)
    }
  })
  es.start(0)
}
