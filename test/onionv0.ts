import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { describe } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { OnionV0 } from "../typechain-types";
import { BigNumber } from "ethers";

describe("OnionV0", function() {
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MINTER_ROLE = ethers.utils.solidityKeccak256(["string"], ["MINTER_ROLE"]);
  const UPGRADER_ROLE = ethers.utils.solidityKeccak256(["string"], ["UPGRADER_ROLE"]);

  let nfToken: OnionV0;
  let owner: SignerWithAddress, bob: SignerWithAddress, jane: SignerWithAddress, sara: SignerWithAddress;

  const gwei50 = ethers.utils.parseUnits("50", "gwei");
  const gwei1 = ethers.utils.parseUnits("1", "gwei");

  const genAccessControlErrMsg = (account: SignerWithAddress, role: String) =>
    `AccessControl: account ${account.address.toLowerCase()} is missing role ${role}`;

  beforeEach(async () => {
    const nftContract = await ethers.getContractFactory("OnionV0");
    nfToken = await upgrades.deployProxy(nftContract, ["ONiON", "ONiON", "https://mvlnft.io/meta/", 3], { kind: "uups" }) as OnionV0;
    [owner, bob, jane, sara] = await ethers.getSigners();
    await nfToken.deployed();
  });

  it("support owner with DEFAULT_ADMIN_ROLE's admin", async function() {
    expect(await nfToken.owner()).to.equal(owner.address);
  });

  it("safeMint success only default admin", async function() {
    const safeMint = await nfToken.safeMint(bob.address);
    await safeMint.wait(1);
    expect(await nfToken.ownerOf(0)).to.equal(bob.address);
  });

  it("throws safeMint caller is not the owner", async function() {
    await expect(nfToken.connect(bob).safeMint(bob.address)).to.be.revertedWith(genAccessControlErrMsg(bob, DEFAULT_ADMIN_ROLE));
    await expect(nfToken.ownerOf(0)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  // it("throws mint if totalSupply is over MAX_SUPPLY", async function() {
  //   const mint1 = await nfToken.mint(bob.address, 3);
  //   await mint1.wait(1);
  //   const mint2 = await nfToken.mint(bob.address, 2);
  //   await mint2.wait(1);
  //   const mint3 = await nfToken.mint(bob.address, 1);
  //   await mint3.wait(1);
  //   expect(await nfToken.totalSupply()).to.equal(3);
  //   expect(await nfToken.ownerOf(2)).to.equal(bob.address);
  //
  //   await expect(nfToken.mint(bob.address, 0)).to.be.revertedWith("Purchase would exceed max tokens");
  //   await expect(nfToken.ownerOf(0)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  // });

  it("throws safeMint if totalSupply is over MAX_SUPPLY", async function() {
    await nfToken.safeMint(bob.address);
    await nfToken.safeMint(bob.address);
    const mint3 = await nfToken.safeMint(bob.address);
    await mint3.wait(1);
    expect(await nfToken.ownerOf(2)).to.equal(bob.address);
    await expect(nfToken.safeMint(bob.address)).to.be.revertedWith("Purchase would exceed max tokens");
    await expect(nfToken.ownerOf(3)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("throws saleMint if totalSupply is over MAX_SUPPLY", async function() {
    await nfToken.saleMint(bob.address);
    await nfToken.saleMint(bob.address);
    const mint3 = await nfToken.saleMint(bob.address);
    await mint3.wait(1);
    expect(await nfToken.ownerOf(2)).to.equal(bob.address);
    await expect(nfToken.saleMint(bob.address)).to.be.revertedWith("Purchase would exceed max tokens");
    await expect(nfToken.ownerOf(3)).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  describe("upgrade", function() {
    it("throws caller is not upgrader", async function() {
      const OnionV1 = await ethers.getContractFactory("OnionV1", bob);

      await expect(upgrades.upgradeProxy(nfToken.address, OnionV1)).to.be.revertedWith(genAccessControlErrMsg(bob, UPGRADER_ROLE));
    });
    it("Should return the new tokenURI once it's minted", async function() {
      expect(await nfToken.hasRole(UPGRADER_ROLE, owner.address)).to.equal(true);

      expect(await nfToken.hasRole(UPGRADER_ROLE, bob.address)).to.equal(false);
      expect(await nfToken.hasRole(MINTER_ROLE, bob.address)).to.equal(false);

      const safeMintTx = await nfToken
        .safeMint(bob.address);
      await safeMintTx.wait();

      expect(await nfToken.tokenURI(0)).to.equal("https://mvlnft.io/meta/0");

      const OnionV1 = await ethers.getContractFactory("OnionV1");

      const upgradeTx = await upgrades.upgradeProxy(nfToken.address, OnionV1);
      await upgradeTx.deployed();

      expect(await nfToken.tokenURI(0)).to.equal("https://mvlnft.io/metadata/0");
    });
  });

  describe("baseURI", function() {
    it("default baseURI when it is deployed", async function() {
      expect(await nfToken.baseURI()).to.equal("https://mvlnft.io/meta/");
    });

    it("setBaseURI success, it changes baseURI", async function() {
      const setBaseURI = await nfToken.setBaseURI("https://mvlnft.io/metadata/");
      await setBaseURI.wait(1);
      expect(await nfToken.baseURI()).to.equal("https://mvlnft.io/metadata/");
    });
    it("setBaseURI success, it changes baseURI to empty string", async function() {
      const setBaseURI = await nfToken.setBaseURI("");
      await setBaseURI.wait(1);
      expect(await nfToken.baseURI()).to.equal("");
    });
    it("throws error on setBaseURI when non admin calls it", async function() {
      await expect(nfToken.connect(bob).setBaseURI("https://mvlnft.io/metadata/")).to.be.revertedWith(genAccessControlErrMsg(bob, DEFAULT_ADMIN_ROLE));
    });
    describe("token 0 minted", function() {
      beforeEach(async () => {
        await nfToken.safeMint(bob.address);
      });
      it("base, no specific uri: baseURI + tokenId", async function() {
        expect(await nfToken.tokenURI(0)).to.equal("https://mvlnft.io/meta/0");
      });
      it("base, specific uri: baseURI + specific uri", async function() {
        await nfToken.setTokenUri(0, "some-specific-uri");
        expect(await nfToken.tokenURI(0)).to.equal("https://mvlnft.io/meta/some-specific-uri");
      });
      it("empty base, no specific uri: empty string", async function() {
        const setBaseURI = await nfToken.setBaseURI("");
        await setBaseURI.wait(1);
        expect(await nfToken.tokenURI(0)).to.equal("");
      });
      it("empty base, specific uri: specific uri", async function() {
        const setBaseURI = await nfToken.setBaseURI("");
        await setBaseURI.wait(1);
        await nfToken.setTokenUri(0, "some-specific-uri");
        expect(await nfToken.tokenURI(0)).to.equal("some-specific-uri");
      });
    });
  });
  describe("minter", function() {
    const MINTER_ROLE = ethers.utils.solidityKeccak256(["string"], ["MINTER_ROLE"]);

    it("deployer has minter role so it can mint with saleMint", async function() {
      let estimation: BigNumber = BigNumber.from(0);
      estimation = estimation.add(await nfToken.estimateGas.saleMint(bob.address));
      await expect(nfToken.saleMint(bob.address)).emit(nfToken, "Transfer");
      console.log(`saleMint estimation: ${estimation}`)
      console.log(ethers.utils.formatEther(estimation.mul(gwei1)));
      console.log(ethers.utils.formatEther(estimation.mul(gwei50)));
    });
    it("bob doesn't have minter role so it throws", async function() {
      await expect(nfToken.connect(bob).saleMint(bob.address)).to.be.revertedWith(genAccessControlErrMsg(bob, MINTER_ROLE));
    });
    it("deployer has ADMIN role so it can set bob as minter", async function() {
      await expect(nfToken.setMinter(bob.address)).emit(nfToken, "RoleGranted");
    });
    it("deployer has ADMIN role so it can removeFromMinter bob", async function() {
      const setMinter = await nfToken.setMinter(bob.address);
      await setMinter.wait(1);
      await expect(nfToken.removeFromMinter(bob.address)).emit(nfToken, "RoleRevoked");
    });
  });
});
