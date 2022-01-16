import { task } from "hardhat/config";

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

import { HardhatUserConfig } from "hardhat/types";
import { NetworkUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import 'hardhat-contract-sizer';

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

// https://eth-mainnet.alchemyapi.io/v2/<key>

const MNEMONIC = process.env.MNEMONIC_PROD || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";
const KOVAN_PK = process.env.KOVAN_DEPLOYER_PRIVATE_KEY || "";
const MAINNET_PK = process.env.MAINNET_DEPLOYER_PRIVATE_KEY || "";
const ALCHEMY_KOVAN = process.env.ALCHEMY_KOVAN_KEY || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {
  if (network === "kovan") {
    const url: string = "https://eth-kovan.alchemyapi.io/v2/" + ALCHEMY_KOVAN;
    return {
      accounts: [KOVAN_PK],
      chainId: chainIds[network],
      url,
    };
  } else if (network === "mainnet") {
    const url: string = "https://eth-mainnet.alchemyapi.io/v2/" + ALCHEMY_KEY;;
    return {
      accounts: [MAINNET_PK],
      chainId: chainIds[network],
      url,
    };
  } else {
    const url: string = "https://" + network + ".infura.io/v3/" + INFURA_API_KEY;
    return {
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
      },
      chainId: chainIds[network],
      url,
    };
  }
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const fork_url: string = "https://eth-mainnet.alchemyapi.io/v2/" + ALCHEMY_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: fork_url,
        blockNumber: 13603028,
      },
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: chainIds.hardhat,
      blockGasLimit: 28500000 // this is also eth mainnet current block limit
    },
    mainnet: createTestnetConfig("mainnet"),
    goerli: createTestnetConfig("goerli"),
    kovan: createTestnetConfig("kovan"),
    rinkeby: createTestnetConfig("rinkeby"),
    ropsten: createTestnetConfig("ropsten"),
  },
  solidity: {
    compilers: [
      {
        version: "0.8.1",
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 75,
    enabled: process.env.REPORT_GAS ? true : false,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 2000000
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  }
};

export default config;
