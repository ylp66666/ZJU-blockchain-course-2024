// contracts/scripts/deploy.ts

import { ethers } from "hardhat";

async function main() {

  // 部署 BuyMyRoom 合约
  const BuyMyRoom = await ethers.getContractFactory("BuyMyRoom");
  // const buyMyRoom = await BuyMyRoom.deploy(myToken.address);
  const buyMyRoom = await BuyMyRoom.deploy();
  await buyMyRoom.deployed();
  console.log(`BuyMyRoom deployed to ${buyMyRoom.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
