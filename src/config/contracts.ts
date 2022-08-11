import { Chain } from './chain'

export default {
  marketplace: {
    [Chain.MAINNET]: {
      contractPackageHash:
        'hash-6db1ff432a74c4191eda03327b31c5875efa93891404456e30c3dc1a7b91148e',
      versions: [
        'hash-293a3700d587190b4a425dcbfb5ac04bf28680d65775bee72269a1478b19ce75',
      ],
    },
    [Chain.TESTNET]: {
      contractPackageHash:
        'hash-002f2aefa6647a871022965a8366be029e821ad8e2ad63d4ade105cef2a0b183',
      versions: [
        'hash-3a03d42a5b7eb1b52da25ee862f6b296b5c823bf2df57c249dd4fbd110fb0860',
      ],
    },
  },
}
