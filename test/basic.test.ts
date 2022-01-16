import { ethers, waffle } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

const BLITMAP = "0x8d04a8c79cEB0889Bdd12acdF3Fa9D207eD3Ff63";

describe("Mint & Burn Single NFT", () => {
  let NftVandal: Contract;
  let vTokenId: BigNumber;
  let vTokenId2: BigNumber;
  let bTokenId: BigNumber;
  let deployer: SignerWithAddress;
  let minter: SignerWithAddress;
  let burner: SignerWithAddress;

  before(async () => {
    [deployer, minter, burner] = await ethers.getSigners();
    const TestTokenFactory: ContractFactory = await ethers.getContractFactory("RightClickNFT", deployer);
    NftVandal = await TestTokenFactory.deploy(deployer.address);
    await NftVandal.deployed();
  });

  async function getCurrentUserETHBalance(user: SignerWithAddress) {
    const balance = await user.getBalance("latest");
    return balance;
  }

  async function mintAtWillWithUser(user: SignerWithAddress, id: string) {
    const instance = NftVandal.connect(user);
    const mintPrice = await instance.getCurrentPriceToMint();
    const tx = await instance.mint(BLITMAP, id, { value: mintPrice });
    const receipt = await tx.wait();
    const details = receipt.events?.filter((eventData: any) => {
      return eventData;
    });
    const vTokenId = details[1].args.vToken;
    return vTokenId;
  }

  describe("Minting", async () => {
    it("mint()", async () => {
      const mintPrice = await NftVandal.getCurrentPriceToMint();
      const tx = await NftVandal.mint(BLITMAP, "490", "tag", { value: mintPrice });
      const receipt = await tx.wait();
      const details = receipt.events?.filter((eventData: any) => {
        return eventData;
      });
      vTokenId = details[1].args.vToken;
    });

    it("mint() x10", async () => {
      for (let i = 480; i < 490; i++) {
        const mintPrice = await NftVandal.getCurrentPriceToMint();
        const tx = await NftVandal.mint(BLITMAP, i, "tag", { value: mintPrice });
        let receipt = await tx.wait();
        if (i == 489) {
          const details = receipt.events?.filter((eventData: any) => {
            return eventData;
          });
          vTokenId2 = details[1].args.vToken;
        }
      }
    });

    it("mint() already defaced", async () => {
      const mintPrice = await NftVandal.getCurrentPriceToMint();
      expect(NftVandal.mint(BLITMAP, "484", "tag",{ value: mintPrice })).to.be.reverted.revertedWith("already defaced");
    });

    it("mint() try to deface again", async () => {
      const mintPrice = await NftVandal.getCurrentPriceToMint();
      expect(NftVandal.mint(BLITMAP, "484", "tag",{ value: mintPrice })).to.be.reverted.revertedWith("already defaced");
    });

    it("mint() loop deface forbidden", async () => {
      const mintPrice = await NftVandal.getCurrentPriceToMint();
      expect(NftVandal.mint(NftVandal.address, vTokenId, "tag", { value: mintPrice })).to.be.reverted.revertedWith(
        "loop deface forbidden",
      );
    });

    it("mint() not enough eth", async () => {
      const mintPrice: BigNumber = await NftVandal.getCurrentPriceToMint();
      const subPrice = mintPrice.sub(ethers.utils.parseEther("0.00155"));
      expect(NftVandal.mint(BLITMAP, "492", "tag",{ value: subPrice })).to.be.reverted.revertedWith("not enough eth sent");
    });

    it("mint() too much eth (should return)", async () => {
      const balanceBefore: BigNumber = await getCurrentUserETHBalance(deployer); // how much user has
      const mintPrice: BigNumber = await NftVandal.getCurrentPriceToMint(); // how much to pay
      const addPrice: BigNumber = mintPrice.add(ethers.utils.parseEther("0.5155")); // exceed pay amount by that much

      const tx = await NftVandal.mint(BLITMAP, "493","tag", { value: addPrice });
      const receipt = await tx.wait();
      const txCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const balanceAfter = await getCurrentUserETHBalance(deployer);
      const realCost = balanceBefore.add(mintPrice).add(txCost);

      console.log(
        "Balance:",
        ethers.utils.formatEther(balanceBefore.sub(mintPrice).toString()),
        "BalanceAfter",
        ethers.utils.formatEther(balanceAfter.toString()),
        "If not returned:",
        ethers.utils.formatEther(balanceBefore.sub(addPrice).toString()),
      );

      // expect(balanceBefore.sub(mintPrice) == balanceAfter);
    });

    it("mint() target nft has no tokenURI func", async () => {
      const mintPrice = await NftVandal.getCurrentPriceToMint();
      expect(NftVandal.mint("0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8", "1", "tag",{ value: mintPrice })).to.be.reverted;
    });

  });

  describe("Burning", async () => {
    it("burn()", async () => {
      const burnPrice = await NftVandal.getCurrentPriceToBurn();
      const tx = await NftVandal.burn(vTokenId, "shorter than 30 bytes", { value: burnPrice });
      let receipt = await tx.wait();
      let details = receipt.events?.filter((eventData: any) => {
        return eventData;
      });
      bTokenId = details[1].args.vToken;
    });

    it("burn() already burned", async () => {
      const burnPrice = await NftVandal.getCurrentPriceToBurn();
      expect(NftVandal.burn(vTokenId, "shorter than 30 bytes", { value: burnPrice })).to.be.revertedWith("already burned");
    });

    it("burn() tag too long", async () => {
      const burnPrice = await NftVandal.getCurrentPriceToBurn();
      expect(NftVandal.burn(vTokenId, "longert than 30 bytessssssssssssssss", { value: burnPrice })).to.be.revertedWith("tag max len = 30");
    });

    it("burn() should transfer eth to owner", async () => {
      const burnerInstance = NftVandal.connect(burner);
      const balanceBefore: BigNumber = await getCurrentUserETHBalance(deployer); // balance of owner of burned nft
      const burnPrice = await burnerInstance.getCurrentPriceToBurn();
      const tx = await burnerInstance.burn(vTokenId2, "shorter than 30 bytes", { value: burnPrice });
      await tx.wait();
      const balanceAfter: BigNumber = await getCurrentUserETHBalance(deployer);
      console.log("before", ethers.utils.formatEther(balanceBefore.toString()), "after", ethers.utils.formatEther(balanceAfter.toString()))
    });
  });

  describe("Withdraw ETH from contract", async () => {
    it("withdrawETH()", async () => {
      const prov = waffle.provider;
      const balanceBefore = await prov.getBalance(NftVandal.address);
      console.log("Contract balance", ethers.utils.formatEther(balanceBefore.toString()))
      await NftVandal.withdrawETH();
      const balanceAfter = await prov.getBalance(NftVandal.address);
      console.log("Contract balance", ethers.utils.formatEther(balanceAfter.toString()))
      expect(balanceAfter).to.be.equal(0);
    });

    it("withdrawETH() not authorized", async () => {
      const instance = NftVandal.connect(minter);
      expect(instance.withdrawETH()).to.be.revertedWith("Not allowed");
    });

  });

  describe("View Functions", async () => {
    it("canBeTagged() true", async () => {
      expect(await NftVandal.checkIfTagged(BLITMAP, 481)).to.be.true;
    });
    
    it("canBeTagged() false", async () => {
      expect(await NftVandal.checkIfTagged(BLITMAP, 499)).to.be.false;
    });

    it("getStatus()", async () => {
      const result = await NftVandal.getStatus(vTokenId);
      console.log(result);
    });

    it("randomNum()", async () => {
      const result = await NftVandal.randomNum(vTokenId);
      console.log("first:", result.toString());
      const result2 = await NftVandal.randomNum(vTokenId);
      console.log("second:", result2.toString());
      const result3 = await NftVandal.randomNum(vTokenId2);
      console.log("second:", result3.toString());
    });

  });

});
