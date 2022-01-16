import { ethers, network } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { RightClickNFT__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const hre = require("hardhat");

const NFT_VANDAL_MAINNET = "";

const gasPrice = async () => {
  const gasPrice = await network.provider.send("eth_gasPrice", []);
  const currentBlock = await network.provider.send("eth_blockNumber", []);
  const blockData = await network.provider.send("eth_getBlockByNumber", [currentBlock, false]);
  return {
    gasPriceEstimate: BigNumber.from(gasPrice),
    baseFee: BigNumber.from(blockData.baseFeePerGas),
  };
};

async function main(): Promise<void> {
  let NftVandal: Contract;
  let deployer: SignerWithAddress;

  [deployer] = await ethers.getSigners();
  console.log("new vandal_king", deployer.address);
  console.log("Deploying");
  const RCContractFactory = new RightClickNFT__factory(deployer);

  NftVandal = await RCContractFactory.deploy(deployer.address);
  const tx = await NftVandal.deployed();
  console.log(tx.deployTransaction);
  console.log("RightClick deployed to: ", NftVandal.address);

  const finalGasPaid: BigNumber = tx.deployTransaction.gasPrice || BigNumber.from("0");
  console.log("Gas price paid", ethers.utils.formatUnits(finalGasPaid, "gwei").toString());
  console.log(tx.deployTransaction.maxFeePerGas?.toString(), tx.deployTransaction.maxPriorityFeePerGas?.toString());
}

async function withdrawETHFromContract() {
  let deployer: SignerWithAddress;
  [deployer] = await ethers.getSigners();

  let prov = ethers.provider;
  let NftVandal = new Contract(NFT_VANDAL_MAINNET, RightClickNFT__factory.abi, deployer);
  const balanceBefore = await prov.getBalance(NftVandal.address);
  console.log("Contract balance", ethers.utils.formatEther(balanceBefore.toString()));
  const tx = await NftVandal.withdrawETH();
  await tx.wait();
  const balanceAfter = await prov.getBalance(NftVandal.address);
  console.log("tx", tx);
  console.log("New contract balance", ethers.utils.formatEther(balanceAfter.toString()));
}

async function testConnectionWithCall() {
  let deployer: SignerWithAddress;

  [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance("latest");
  console.log("Balance", ethers.utils.formatEther(balance));
  console.log("Owner", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
