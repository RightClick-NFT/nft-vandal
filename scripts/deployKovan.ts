import { ethers } from "hardhat";
import { Contract } from "ethers";
import { RightClickNFT__factory } from "../typechain"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const hre = require("hardhat");

const NFT_VANDAL_KOVAN = ""

async function main(): Promise<void> {
  let NftVandal: Contract;
  let deployer: SignerWithAddress;

  [deployer] = await ethers.getSigners();

  console.log(deployer.address);
  const RCContractFactory = new RightClickNFT__factory(deployer);  
  NftVandal = await RCContractFactory.deploy(deployer.address);
  await NftVandal.deployed();
  console.log("RightClick deployed to: ", NftVandal.address);

}

async function withdrawETHFromContract() {
  let deployer: SignerWithAddress;
  [deployer] = await ethers.getSigners();

  let prov = ethers.provider;
  let NftVandal = new Contract(NFT_VANDAL_KOVAN, RightClickNFT__factory.abi, deployer);
  const balanceBefore = await prov.getBalance(NftVandal.address);
  console.log("Contract balance", ethers.utils.formatEther(balanceBefore.toString()))
  const tx = await NftVandal.withdrawETH();
  await tx.wait();
  const balanceAfter = await prov.getBalance(NftVandal.address);
  console.log("tx", tx);
  console.log("New contract balance", ethers.utils.formatEther(balanceAfter.toString()))
  
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
