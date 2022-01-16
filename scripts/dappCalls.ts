import { ethers, network } from "hardhat";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const BLITMAP = "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63";

const gasPrice = async () => {
  const gasPrice = await network.provider.send("eth_gasPrice", [])
  return BigNumber.from(gasPrice);
}

async function main(): Promise<void> {
  let NftVandal: Contract;
  let deployer: SignerWithAddress;

  [deployer] = await ethers.getSigners();

  const TestTokenFactory: ContractFactory = await ethers.getContractFactory("RightClickNFT");
  const currentGasPrice = await gasPrice();
  console.log("gas read", currentGasPrice)
  NftVandal = await TestTokenFactory.deploy(deployer.address);
  const tx = await NftVandal.deployed();
  console.log("TestToken deployed to: ", NftVandal.address);
  console.log("Gas price", tx.deployTransaction.gasPrice)

  await mintSomeMore();

  async function mintSomeMore() {
    const vTokens: BigNumber[] = [];
    for (let i = 400; i < 490; i++) {
      const mintPrice = await NftVandal.getCurrentPriceToMint();
      const tx = await NftVandal.mint(BLITMAP, i, "tag" + i.toString(), { value: mintPrice });
      let receipt = await tx.wait();
      let details = receipt.events?.filter((eventData: any) => {
        return eventData;
      });
      // console.log("nft-vandal tokenId:", details[1].args.vToken.toString());
      // vTokens.push(details[1].args.vToken)
      printStatus(details[1].args.vToken);
      getMintPrices();
    }
  }

  async function getMintPrices() {
    const mintPrice = await NftVandal.getCurrentPriceToMint();
    const burnPrice = await NftVandal.getCurrentPriceToBurn();
    console.log("mint", ethers.utils.formatEther(mintPrice), "burn", ethers.utils.formatEther(burnPrice));
  }

  async function printStatus(vTokens: BigNumber) {
    // for (let i = 0; i < vTokens.length; i++) {
    //   const status = await NftVandal.getStatus(vTokens[i])
    //   console.log("TokenID", vTokens[i], "status", status)
    // }
    const status = await NftVandal.getStatus(vTokens);
    console.log(
      "TokenID",
      vTokens.toString(),
      "\n",
      "nft",
      status.nft,
      "\n",
      "tokenId",
      status.tokenId,
      "\n",
      "tag",
      status.tag,
      "\n",
      "status",
      status.status.toString(),
      "\n",
      "trait",
      status.trait.toString(),
      "\n",
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
