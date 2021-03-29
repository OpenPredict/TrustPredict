// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

interface IOracle {
    function validPriceAggregator(address _priceAggregator) external view returns (bool);
    function getPairing(address _priceAggregator) external returns(string memory);
    function getLatestPrice(address _priceAggregator) external returns(int256);
}