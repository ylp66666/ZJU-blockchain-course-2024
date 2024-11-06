import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      // rpc url, change it according to your ganache configuration
      url: '',
      // the private key of signers, change it according to your ganache user
      accounts: [
        ''
      ]
    },
  },
};

export default config;
