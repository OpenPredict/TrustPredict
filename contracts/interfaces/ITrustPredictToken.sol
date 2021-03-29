// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./../libraries/Utils.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

interface ITrustPredictToken {    
    function createTokens(address _eventId) external returns(bool);
    function mint(address eventId, address to, uint256 amount, uint8 selection) external returns(bool);
    function burn(address eventId, address from, uint256 amount, uint8 selection) external returns(bool);
    function transferFrom(address eventId, address from, address to, uint256 amount, uint8 selection) external returns(bool);
    function balanceOfAddress(address eventId, address _address, uint8 selection) view external returns(uint256);
    function getTokenBalance(address eventId, uint8 selection) external view returns (uint256);
    function getTokenBalances(address eventId) external view returns (uint256, uint256);
    function getTotalSupply(address _eventId) external view returns(uint256);
}