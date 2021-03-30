// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Oracle is Ownable {

    // storage
    struct Pairing {
        string value;
        bool set;
    }
    mapping(address => Pairing) priceAggregators; // price aggregator contracts mapped to Pairings

    // gatekeepers
    function _validPriceAggregator(address _priceAggregator) view internal {
        // require that oracle address is valid
        Pairing memory pairing = priceAggregators[_priceAggregator];
        require(pairing.set, 
                "Oracle: Invalid Price Aggregator address.");
    }

    // functions
    function setPriceAggregators(address[] calldata _priceAggregators, string[] calldata _pairs) external onlyOwner {
        for(uint i=0;i < _priceAggregators.length; i++){
            priceAggregators[_priceAggregators[i]] = Pairing(_pairs[i], true);
        }
    }

    function validPriceAggregator(address _priceAggregator) external view returns (bool)
    {
        _validPriceAggregator(_priceAggregator);
        return true;
    }

    /**
     * Get the pairing for the price aggregator
     */
    function getPairing(address _priceAggregator) external view returns(string memory) {
        _validPriceAggregator(_priceAggregator);

        return priceAggregators[_priceAggregator].value;
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice(address _priceAggregator) external view returns (int256) {
        return AggregatorInterface(_priceAggregator).latestAnswer();
    }
}
