import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BuyMyRoom Contract", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const BuyMyRoom = await ethers.getContractFactory("BuyMyRoom");
    const buyMyRoom = await BuyMyRoom.deploy();

    return { buyMyRoom, owner, user1, user2 };
  }

  it("用户可以免费领取房屋NFT", async function () {
    const { buyMyRoom, user1 } = await loadFixture(deployFixture);
    await buyMyRoom.connect(user1).claimHouse();

    const balance = await buyMyRoom.balanceOf(user1.address);
    expect(balance).to.equal(1);
  });

  it("用户可以挂单出售房屋", async function () {
    const { buyMyRoom, user1 } = await loadFixture(deployFixture);
    await buyMyRoom.connect(user1).claimHouse();

    await buyMyRoom.connect(user1).listHouse(1, ethers.utils.parseEther("1"));

    const houseInfo = await buyMyRoom.getHouseInfo(1);
    expect(houseInfo.isListed).to.equal(true);
    expect(houseInfo.price).to.equal(ethers.utils.parseEther("1"));
  });

  it("用户可以购买他人出售的房屋", async function () {
    const { buyMyRoom, user1, user2 } = await loadFixture(deployFixture);
    await buyMyRoom.connect(user1).claimHouse();
    await buyMyRoom.connect(user1).listHouse(1, ethers.utils.parseEther("1"));

    await buyMyRoom.connect(user2).buyHouse(1, { value: ethers.utils.parseEther("1") });

    const newOwner = await buyMyRoom.ownerOf(1);
    expect(newOwner).to.equal(user2.address);
  });

  it("购买后手续费应转给合约拥有者", async function () {
    const { buyMyRoom, owner, user1, user2 } = await loadFixture(deployFixture);
    await buyMyRoom.connect(user1).claimHouse();
    await buyMyRoom.connect(user1).listHouse(1, ethers.utils.parseEther("1"));

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    await buyMyRoom.connect(user2).buyHouse(1, { value: ethers.utils.parseEther("1") });

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

    expect(ownerBalanceAfter).to.be.above(ownerBalanceBefore);
  });
});
