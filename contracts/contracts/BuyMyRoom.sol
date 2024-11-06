// contracts/contracts/BuyMyRoom.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// 引入 OpenZeppelin 的 ERC721 和 Ownable 合约
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BuyMyRoom is ERC721Enumerable, Ownable {
    // 事件定义
    event HouseListed(uint256 indexed tokenId, uint256 price, address indexed owner);
    event HouseDelisted(uint256 indexed tokenId, address indexed owner);
    event HouseSold(uint256 indexed tokenId, uint256 price, address indexed buyer);

    // 房屋结构体
    struct House {
        address owner;
        uint256 listedTimestamp;
        uint256 price;
        bool isListed;
    }

    // 房屋 ID 计数器
    uint256 private _houseIdCounter = 1;

    // 房屋映射
    mapping(uint256 => House) public houses;

    // 挂单列表
    uint256[] public listedHouses;

    // 手续费比例（例如，5 表示 0.05%）
    uint256 public feeRate = 5;

    constructor() ERC721("MyHouseToken", "MHT") Ownable(msg.sender) {
        // token = MyToken(tokenAddress);
    }

    // 领取房屋 NFT
    function claimHouse() external {
        uint256 tokenId = _houseIdCounter;
        _houseIdCounter++;

        _safeMint(msg.sender, tokenId);

        // 初始化房屋信息
        houses[tokenId] = House({
            owner: msg.sender,
            listedTimestamp: 0,
            price: 0,
            isListed: false
        });
    }

    // 获取用户拥有的房屋列表
    function getMyHouses() external view returns (uint256[] memory) {
        uint256 balance = balanceOf(msg.sender);
        uint256[] memory myHouses = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            myHouses[i] = tokenOfOwnerByIndex(msg.sender, i);
        }
        return myHouses;
    }

    // 挂单出售房屋
    function listHouse(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this house");
        require(price > 0, "Price must be greater than 0");
        require(houses[tokenId].isListed == false, "House is already listed");

        houses[tokenId].price = price;
        houses[tokenId].listedTimestamp = block.timestamp;
        houses[tokenId].isListed = true;

        listedHouses.push(tokenId);

        emit HouseListed(tokenId, price, msg.sender);
    }

    // 取消挂单
    function delistHouse(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this house");
        require(houses[tokenId].isListed == true, "House is not listed");

        houses[tokenId].price = 0;
        houses[tokenId].listedTimestamp = 0;
        houses[tokenId].isListed = false;

        // 从挂单列表中移除
        for (uint256 i = 0; i < listedHouses.length; i++) {
            if (listedHouses[i] == tokenId) {
                listedHouses[i] = listedHouses[listedHouses.length - 1];
                listedHouses.pop();
                break;
            }
        }

        emit HouseDelisted(tokenId, msg.sender);
    }

    // 获取所有正在出售的房屋
    function getAllListedHouses() external view returns (uint256[] memory) {
        return listedHouses;
    }

    // 获取房屋详细信息
    function getHouseInfo(uint256 tokenId) external view returns (House memory) {
        return houses[tokenId];
    }

    // 使用以太币购买房屋
    function buyHouse(uint256 tokenId) external payable {
        require(houses[tokenId].isListed == true, "House is not listed for sale");
        require(msg.value >= houses[tokenId].price, "Insufficient Ether provided");

        address seller = ownerOf(tokenId);
        uint256 price = houses[tokenId].price;
        uint256 listedTimestamp = houses[tokenId].listedTimestamp;

        // 计算手续费
        uint256 duration = block.timestamp - listedTimestamp;
        uint256 fee = (duration * feeRate * price) / (10000);

        // 转账
        uint256 sellerAmount = price - fee;
        payable(seller).transfer(sellerAmount);
        payable(owner()).transfer(fee); // 手续费转给合约拥有者

        // 转移 NFT 所有权
        _transfer(seller, msg.sender, tokenId);

        // 更新房屋信息
        houses[tokenId].owner = msg.sender;
        houses[tokenId].listedTimestamp = 0;
        houses[tokenId].price = 0;
        houses[tokenId].isListed = false;

        // 从挂单列表中移除
        for (uint256 i = 0; i < listedHouses.length; i++) {
            if (listedHouses[i] == tokenId) {
                listedHouses[i] = listedHouses[listedHouses.length - 1];
                listedHouses.pop();
                break;
            }
        }

        emit HouseSold(tokenId, price, msg.sender);
    }

    // 获取合约拥有者（手续费接收者）
    function getOwner() external view returns (address) {
        return owner();
    }

    // 设置手续费比例（仅限合约拥有者）
    function setFeeRate(uint256 newRate) external onlyOwner {
        feeRate = newRate;
    }
}
