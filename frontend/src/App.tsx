// frontend/src/App.tsx

import React, { useState, useEffect } from 'react';
import {
  BrowserProvider,
  Contract,
  formatEther,
  parseEther,
} from 'ethers';
import BuyMyRoomABI from './contracts/BuyMyRoom.json';
import { BUY_MY_ROOM_ADDRESS } from './config';

interface House {
  tokenId: number;
  owner: string;
  price: bigint;
  listedTimestamp: number;
  isListed: boolean;
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [buyMyRoomContract, setBuyMyRoomContract] = useState<Contract | null>(null);
  const [myHouses, setMyHouses] = useState<House[]>([]);
  const [listedHouses, setListedHouses] = useState<House[]>([]);

  // 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const selectedAccount = await signer.getAddress();
        setAccount(selectedAccount);

        console.log('当前账户地址：', selectedAccount);
        console.log('合约地址：', BUY_MY_ROOM_ADDRESS);

        const buyMyRoom = new Contract(
          BUY_MY_ROOM_ADDRESS,
          BuyMyRoomABI.abi,
          signer
        );
        setBuyMyRoomContract(buyMyRoom);
      } catch (error) {
        console.error('钱包连接失败', error);
      }
    } else {
      alert('请安装 MetaMask 钱包');
    }
  };

  // 获取我的房屋列表
  const fetchMyHouses = async () => {
    if (buyMyRoomContract && account) {
      try {
        const houseIds = await buyMyRoomContract.getMyHouses();
        const houses: House[] = [];
        for (const id of houseIds) {
          const tokenId = Number(id);
          const houseInfo = await buyMyRoomContract.getHouseInfo(tokenId);
          houses.push({
            tokenId,
            owner: houseInfo.owner,
            price: BigInt(houseInfo.price.toString()),
            listedTimestamp: Number(houseInfo.listedTimestamp),
            isListed: houseInfo.isListed,
          });
        }
        setMyHouses(houses);
      } catch (error) {
        console.error('获取我的房屋列表失败', error);
      }
    }
  };

  // 获取正在出售的房屋列表
  const fetchListedHouses = async () => {
    if (buyMyRoomContract) {
      try {
        const houseIds = await buyMyRoomContract.getAllListedHouses();
        const houses: House[] = [];
        for (const id of houseIds) {
          const tokenId = Number(id);
          const houseInfo = await buyMyRoomContract.getHouseInfo(tokenId);
          houses.push({
            tokenId,
            owner: houseInfo.owner,
            price: BigInt(houseInfo.price.toString()),
            listedTimestamp: Number(houseInfo.listedTimestamp),
            isListed: houseInfo.isListed,
          });
        }
        setListedHouses(houses);
      } catch (error) {
        console.error('获取正在出售的房屋列表失败', error);
      }
    }
  };

  useEffect(() => {
    if (buyMyRoomContract && account) {
      fetchMyHouses();
    }
  }, [buyMyRoomContract, account]);

  useEffect(() => {
    if (buyMyRoomContract) {
      fetchListedHouses();
    }
  }, [buyMyRoomContract]);

  // 领取房屋
  const claimHouse = async () => {
    if (buyMyRoomContract) {
      try {
        const tx = await buyMyRoomContract.claimHouse();
        await tx.wait();
        alert('领取房屋成功');
        fetchMyHouses();
      } catch (error) {
        console.error('领取房屋失败', error);
      }
    } else {
      console.error('合约实例未创建');
    }
  };

  // 挂单出售房屋
  const listHouse = async (tokenId: number) => {
    const price = prompt('请输入出售价格（ETH）：');
    if (price && buyMyRoomContract) {
      try {
        const tx = await buyMyRoomContract.listHouse(
          tokenId,
          parseEther(price)
        );
        await tx.wait();
        alert('挂单成功');
        fetchListedHouses();
        fetchMyHouses();
      } catch (error) {
        console.error('挂单失败', error);
      }
    }
  };

  // 购买房屋
  const buyHouse = async (tokenId: number) => {
    if (buyMyRoomContract) {
      try {
        const houseInfo = await buyMyRoomContract.getHouseInfo(tokenId);
        const price = BigInt(houseInfo.price.toString());
        const listedTimestamp = Number(houseInfo.listedTimestamp);
        const duration = Math.floor(Date.now() / 1000) - listedTimestamp;

        // 获取手续费比例
        const feeRate = await buyMyRoomContract.feeRate();

        // 计算手续费
        const fee = (BigInt(duration) * BigInt(feeRate) * price) / BigInt(10000);
        const feeInEther = formatEther(fee);

        // 提示用户手续费
        const confirmPurchase = window.confirm(
          `购买该房屋需要支付 ${formatEther(price)} ETH，其中手续费为 ${feeInEther} ETH，是否继续？`
        );
        if (!confirmPurchase) return;

        const tx = await buyMyRoomContract.buyHouse(tokenId, { value: price });
        await tx.wait();
        alert('购买成功');
        fetchListedHouses();
        fetchMyHouses();
      } catch (error) {
        console.error('购买失败', error);
      }
    } else {
      console.error('合约实例未创建');
    }
  };

  return (
    <div>
      <h1>去中心化房屋购买系统</h1>
      {account ? (
        <div>
          <p>已连接账户：{account}</p>
          <button onClick={claimHouse}>领取房屋 NFT</button>
          {/* 删除兑换积分按钮 */}
          {/* <button onClick={exchangeTokens}>兑换积分</button> */}
          <h2>我的房屋列表：</h2>
          <ul>
            {myHouses.map((house) => (
              <li key={house.tokenId}>
                <p>房屋 ID：{house.tokenId}</p>
                <p>是否在出售中：{house.isListed ? '是' : '否'}</p>
                {house.isListed && (
                  <>
                    <p>价格：{formatEther(house.price)} ETH</p>
                    <p>挂单时间：{new Date(house.listedTimestamp * 1000).toLocaleString()}</p>
                  </>
                )}
                {!house.isListed && (
                  <button onClick={() => listHouse(house.tokenId)}>挂单出售</button>
                )}
              </li>
            ))}
          </ul>
          <h2>正在出售的房屋列表：</h2>
          <ul>
            {listedHouses.map((house) => (
              <li key={house.tokenId}>
                <p>房屋 ID：{house.tokenId}</p>
                <p>主人：{house.owner}</p>
                <p>价格：{formatEther(house.price)} ETH</p>
                <p>挂单时间：{new Date(house.listedTimestamp * 1000).toLocaleString()}</p>
                <button onClick={() => buyHouse(house.tokenId)}>购买</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button onClick={connectWallet}>连接钱包</button>
      )}
    </div>
  );
}

export default App;
