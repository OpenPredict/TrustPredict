pragma solidity ^0.6.7;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract OracleTest is ChainlinkClient {

    AggregatorInterface internal priceFeed;
    
    // ChainLink data (Kovan network)
    /* Test: _token from constructor
     * settledPrice = oracle.getLatestPrice();
     */
    address _token            = 0x30690193C75199fdcBb7F588eF3F966402249315; // ChainLink ERC20 (testing)
    address _oracle           = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e; // oracle contract
    address _priceAggregators = 0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C; // Pairings contract (testing)
    string _jobId             =         "a7ab70d561d34eb49e9b1612fd2e044b"; // callback job
    address callee;
    address priceAggregator;
    string pairing;
    
    modifier hasFundedOracle() {
        require(balanceOf(address(this)) == (1 * LINK),
                "Oracle: Oracle contract not prefunded with required LINK.");
        _;
    }

    modifier setPriceAggregator(address _priceAggregator) {
        require(setPriceAggregatorPairing(_priceAggregator),
                "Oracle: Oracle: Invalid Price Aggregator address.");
        priceAggregator = _priceAggregator;
        _;
    }
  
    constructor(uint256 _until, address _priceAggregator)
        hasFundedOracle()
        setPriceAggregator(_priceAggregator)
        public 
    {
    /* Test: don't set
    *   setPublicChainlinkToken();
    *   priceFeed = AggregatorInterface(_priceAggregator);
    *   Chainlink.Request memory req = buildChainlinkRequest(
    *       stringToBytes32(_jobId),
    *       address(this), 
    *       this.fullfill.selector
    *   );
    *   req.addUint("until", _until);
    *   sendChainlinkRequestTo(_oracle, req, 1 * LINK);
    */
        callee = msg.sender;
    }
    
    /**
     * Get the latest price at the correct time
     */
    function fullfill(bytes32 _requestId) 
        recordChainlinkFulfillment(_requestId)
        public
    {
        (bool success, bytes memory result) = callee.call(
            (abi.encodeWithSignature("settle()")
        ));
    }

    /**
     * Get the pairing for the price aggregator
     */
    function setPriceAggregatorPairing(address _priceAggregator) 
        private
        returns (bool)
    {
        (bool success, bytes memory result) = _priceAggregators.call(
            (abi.encodeWithSignature("getPriceAggregatorPairing(address)",
            _priceAggregator)
        ));
        require(success, "Oracle: call to PriceAggregators contract failed");

        pairing = bytesToString(result);
        return true;
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int256) {
        return priceFeed.latestAnswer();
    }

    /**
     * Returns the chosen pairing
     */
    function getPairing() public view returns (string memory) {
        return pairing;
    }

    /**
     * Returns the price aggregator address
     */
    function getPriceAggregator() public view returns (address) {
        return priceAggregator;
    }
    
    // ****** start util functions ******
    function bytesToString(bytes memory _bytes) internal pure returns (string memory _string) {
        assembly {
            _string := mload(0x40)                               // Load string address
            mstore(    _string,        mload(add(_bytes, 0x40))) // Set length
            mstore(add(_string, 0x20), mload(add(_bytes, 0x60))) // Set value
            mstore(0x40, add(_string, 0x40))                     // Increment free memory pointer
        }
    }

    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
    
        assembly {
            result := mload(add(source, 32))
        }
    }
    
    function bytesToUint(bytes memory _bytes) internal pure returns (uint256 result) {
        require(_bytes.length >= 32, "Read out of bounds");
        assembly {
            result := mload(add(_bytes, 0x20))
        }
    }
    
    function balanceOf(address _address) private returns(uint256) {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("balanceOf(address)", 
             _address)
        ));
        require(success, "Oracle: call to ChainLink contract failed");
        return bytesToUint(result);
    }
    // ****** end util functions ******
}
