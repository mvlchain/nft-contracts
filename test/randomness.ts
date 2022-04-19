import { describe } from "mocha";
import { ethers } from "hardhat";
import { Randomness } from "../typechain-types";
import { expect } from "chai";

describe("Randomness", function () {
  let seedRandom: Randomness;

  beforeEach(async () => {
    const seedRandomContract = await ethers.getContractFactory("Randomness");
    seedRandom = (await seedRandomContract.deploy()) as Randomness;
    const seed = ethers.utils.parseEther("642446714.25753680");
    console.log(seed.toHexString());
    await seedRandom.setSeed(seed);
  });

  it("shuffle(size)", async function () {
    const result = await seedRandom.shuffle(100);
    const numberResult = result.map((r) => {
      return r.toNumber();
    });
    console.log(numberResult);
    expect(Math.min(...numberResult)).to.eq(1);
    expect(Math.max(...numberResult)).to.eq(100);
    expect(numberResult.length).to.eq(100);
  });

  it("shuffle(size) print 253", async function () {
    const result = await seedRandom.shuffle(5000);
    const numberResult = result.map((r) => {
      return r.toNumber();
    });
    console.log(numberResult.slice(0, 100));
    console.log(numberResult.slice(100, 200));
    console.log(numberResult.slice(200, 253));
    expect(Math.min(...numberResult)).to.eq(1);
    expect(Math.max(...numberResult)).to.eq(5000);
    expect(numberResult.length).to.eq(5000);
  });
});
