import { config } from 'dotenv'
config()
import { CasperClient } from 'casper-js-sdk'

const { CASPER_NODE_ADDRESS } = process.env

interface Argv {
  reamin: string[]
  cooked: string[]
  original: string[]
}
const main = async () => {
  const client = new CasperClient(CASPER_NODE_ADDRESS!)

  const argv: Argv = JSON.parse(process.env.npm_config_argv || '')
  const deploy_hash = argv.original[1]
  const deploy_info = await client.nodeClient.getDeployInfo(deploy_hash)
  console.dir(deploy_info, { depth: null })
}
main()
