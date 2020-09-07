pragma solidity ^0.6.7;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract Oracle is ChainlinkClient {

    AggregatorInterface internal priceFeed;
    
    // ChainLink data (Kovan network)
    address _token =           0xa36085F69e2889c224210F603D836748e7dC0088; // ChainLink ERC20
    address _oracle          = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e; // oracle contract
    address _priceAggregator = 0xD21912D8762078598283B14cbA40Cb4bFCb87581; // ETH/USD price
    string _jobId            =         "a7ab70d561d34eb49e9b1612fd2e044b"; // callback job
    address callee;
    
    modifier hasFundedOracle() {
        require(balanceOf(address(this)) == (1 * LINK),
        "Oracle: Oracle contract not prefunded with required LINK");
        _;
    }
  
    constructor(uint256 _until)
        hasFundedOracle()
        public 
    {
      setPublicChainlinkToken();
      priceFeed = AggregatorInterface(_priceAggregator);
      Chainlink.Request memory req = buildChainlinkRequest(
          stringToBytes32(_jobId),
          address(this), 
          this.fullfill.selector
      );
      req.addUint("until", _until);
      sendChainlinkRequestTo(_oracle, req, 1 * LINK);
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
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int256) {
        return priceFeed.latestAnswer();
    }
    
    // ****** start util functions ******
    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
    
        assembly {
            result := mload(add(source, 32))
        }
    }
    
    function bytesToUint(bytes memory _bytes) internal pure returns (uint256) {
        require(_bytes.length >= 32, "Read out of bounds");
        uint256 result;
        assembly {
            result := mload(add(_bytes, 0x20))
        }
        return result;
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
