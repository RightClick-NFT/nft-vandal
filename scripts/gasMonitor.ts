import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

// https://hardhat.org/hardhat-network/reference/

// const currentBlock = async () => {
//     const currentBlock = await network.provider.send("eth_blockNumber", [])
//     return BigNumber.from(currentBlock);

// }

// const gasPrice = async () => {
//     const gasPrice = await network.provider.send("eth_gasPrice", [])
//     return BigNumber.from(gasPrice);
// }

async function main() {
    // let currentBlock: BigNumber;
    // let gasPrice: BigNumber;

    const currentBlock = await network.provider.send("eth_blockNumber", [])
    const blockData = await network.provider.send("eth_getBlockByNumber", [currentBlock, false])
    const gasPrice = await network.provider.send("eth_gasPrice", [])

    console.log("block", BigNumber.from(currentBlock).toString(), "gas", ethers.utils.formatUnits(BigNumber.from(gasPrice).toString(), "gwei"));
    console.log(ethers.utils.formatUnits(BigNumber.from(blockData.baseFeePerGas), "gwei").toString());
}


main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
