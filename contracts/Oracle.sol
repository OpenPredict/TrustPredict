// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorInterface.sol";

contract Oracle {

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

    // constructor
    constructor() {
        setPriceAggregators();
    }

    // functions
    function setPriceAggregators() private {
        priceAggregators[0x5813A90f826e16dB392abd2aF7966313fc1fd5B8] = Pairing("AUD/USD",   true);
        priceAggregators[0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219] = Pairing("BAT/USD",   true);
        priceAggregators[0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16] = Pairing("BNB/USD",   true);
        priceAggregators[0x6135b13325bfC4B00278B4abC5e20bbce2D6580e] = Pairing("BTC/USD",   true);
        priceAggregators[0xed0616BeF04D374969f302a34AE4A63882490A8C] = Pairing("CHF/USD",   true);
        priceAggregators[0x777A68032a88E5A84678A77Af2CD65A7b3c0775a] = Pairing("DAI/USD",   true);
        priceAggregators[0x9326BFA02ADD2366b30bacB125260Af641031331] = Pairing("ETH/USD",   true);
        priceAggregators[0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13] = Pairing("EUR/USD",   true);
        priceAggregators[0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9] = Pairing("GBP/USD",   true);
        priceAggregators[0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942] = Pairing("JPY/USD",   true);
        priceAggregators[0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0] = Pairing("LINK/USD",  true);
        priceAggregators[0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640] = Pairing("LTC/USD",   true);
        priceAggregators[0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea] = Pairing("Oil/USD",   true);
        priceAggregators[0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD] = Pairing("SNX/USD",   true);
        priceAggregators[0x4594051c018Ac096222b5077C3351d523F93a963] = Pairing("XAG/USD",   true);
        priceAggregators[0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5] = Pairing("XAU/USD",   true);
        priceAggregators[0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3] = Pairing("XRP/USD",   true);
        priceAggregators[0xC6F39246494F25BbCb0A8018796890037Cb5980C] = Pairing("XTZ/USD",   true);
        priceAggregators[0x70179FB2F3A0a5b7FfB36a235599De440B0922ea] = Pairing("sDEFI/USD", true);
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
