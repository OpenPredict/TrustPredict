pragma solidity ^0.6.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

// Shared utilities between all contracts in TrustPredict.
library Utils {

    enum Token {O, IO}
    enum Side {Higher, Lower}

    string constant network = "development";
    //string memory network = "kovan";

    //************ variables that differ between networks (development, kovan) **********************************
    function GetOPUSDAddress() external pure returns (address _address) {
        _address = compare(network, "kovan") ? 0xB876a52ABD933a02426C31d8231e9B9352864214 : 0xc6ACe392cE166D3f2013302d751Bfc26C166048e;
    }

    function GetChainLinkAddress() external pure returns (address _address) {
        _address = compare(network, "kovan") ? 0xa36085F69e2889c224210F603D836748e7dC0088 : 0x30690193C75199fdcBb7F588eF3F966402249315;
    }

    function GetOracleAddress() external pure returns (address _address) {
        _address = compare(network, "kovan") ? 0x4eb24Db3F49F82A475281d49D3d327f623B6e3dA : 0x4eb24Db3F49F82A475281d49D3d327f623B6e3dA;
    }

    function GetTrustPredictAddress() external pure returns (address _address) {
        _address = compare(network, "kovan") ? 0xd620622a91Ad6F1b25Acc8Dca502a577068F48B7 : 0xd620622a91Ad6F1b25Acc8Dca502a577068F48B7;
    }

    function GetOPEventFactoryAddress() external pure returns (address _address) {
        _address = compare(network, "kovan") ? 0xd620622a91Ad6F1b25Acc8Dca502a577068F48B7 : 0xf2ebd3F6Ee189151577A4446964265152aA6206B;
    }



    function GetNetwork() external pure returns(string memory){        
        return network;
    }
    
    function GetDepositPeriod() external pure returns (uint _depositPeriod) {
        _depositPeriod = compare(network, "kovan") ? 86400 : 10;
    }

    function GetMinimumTokenAmountPerEvent() external pure returns (uint _minimumTokenAmountPerEvent) {
        _minimumTokenAmountPerEvent = compare(network, "kovan") ? 500000000000000000000 : 10000000000000000000;
    }
    //************ variables that differ between networks (development, kovan) **********************************




    //*************** Generic helper functions *******************************************************************/

    function getOtherToken(Token selection) pure external returns (Token) {
        return (selection == Token.O) ? Token.IO : Token.O;
    }

    function compare(string memory a, string memory b) public pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function convertToOPUSDAmount(uint optionAmount) external pure returns(uint) {
        // assumes optionAmount is already encoded
        // 1 O/IO token = 100 USD
        return SafeMath.mul(optionAmount, 100);
    }

    function addressFrom(address _origin, uint _nonce) external pure returns (address _address) {
        bytes memory data;
        if(_nonce == 0x00)          data = abi.encodePacked(byte(0xd6), byte(0x94), _origin, byte(0x80));
        else if(_nonce <= 0x7f)     data = abi.encodePacked(byte(0xd6), byte(0x94), _origin, uint8(_nonce));
        else if(_nonce <= 0xff)     data = abi.encodePacked(byte(0xd7), byte(0x94), _origin, byte(0x81), uint8(_nonce));
        else if(_nonce <= 0xffff)   data = abi.encodePacked(byte(0xd8), byte(0x94), _origin, byte(0x82), uint16(_nonce));
        else if(_nonce <= 0xffffff) data = abi.encodePacked(byte(0xd9), byte(0x94), _origin, byte(0x83), uint24(_nonce));
        else                        data = abi.encodePacked(byte(0xda), byte(0x94), _origin, byte(0x84), uint32(_nonce));
        bytes32 hash = keccak256(data);
        assembly {
            mstore(0, hash)
            _address := mload(0)
        }
    }
    //*************** Generic helper functions *******************************************************************/




    //************************* Start "call" return value/conversion helper functions *************************************
    function bytesToString(bytes memory _bytes) private pure returns (string memory _string) {
        assembly {
            _string := mload(0x40)                               // Load string address
            mstore(    _string,        mload(add(_bytes, 0x40))) // Set length
            mstore(add(_string, 0x20), mload(add(_bytes, 0x60))) // Set value
            mstore(0x40, add(_string, 0x40))                     // Increment free memory pointer
        }
    }

    function bytesToUint(bytes memory _bytes) private pure returns (uint256 result) {
        require(_bytes.length >= 32, "Read out of bounds");
        assembly {
            result := mload(add(_bytes, 0x20))
        }
    }

    function bytesToInt(bytes memory _bytes) private pure returns (int256 result) {
        require(_bytes.length >= 32, "Read out of bounds");
        assembly {
            result := mload(add(_bytes, 0x20))
        }
    }

    function bytesToBool(bytes memory _bytes) private pure returns (bool result) {
        require(_bytes.length >= 32, "Read out of bounds");
        assembly {
            result := mload(add(_bytes, 0x20))
        }
    }

    function stringToBytes32(string memory _string) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(_string);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
    
        assembly {
            result := mload(add(_string, 0x20))
        }
    }
    //************************* End "call" return value/conversion helper functions *************************************




    //**************************** Start Oracle helper functions *****************************************
    function newRequest(uint256 _until, address _priceAggregator, address _oracle, address _eventId) external returns(bool) {
        (bool success, bytes memory result) = _oracle.call(
            (abi.encodeWithSignature("newRequest(uint256,address,address)", 
             _until, _priceAggregator, _eventId)
        ));
        require(success, "OPEvent: call to Oracle contract failed (newRequest)");
        return bytesToBool(result);
    }

    function getLatestPrice(address _priceAggregator, address _oracle) external returns(int256) {
        (bool success, bytes memory result) = _oracle.call(
            (abi.encodeWithSignature("getLatestPrice(address)", 
             _priceAggregator)
        ));
        require(success, "OPEvent: call to Oracle contract failed (getLatestPrice)");
        return bytesToInt(result);
    }

    function getPairing(address _priceAggregator, address _oracle) external returns(string memory) {
        (bool success, bytes memory result) = _oracle.call(
            (abi.encodeWithSignature("getPairing(address)", 
             _priceAggregator)
        ));
        require(success, "OPEvent: call to Oracle contract failed (getPairing)");
        return bytesToString(result);
    }
    //**************************** End Oracle helper functions *****************************************




    //**************************** Start ERC20 helper functions *****************************************
    function transferFrom(address _from, address _to, uint _tokensToTransfer, address _token) external  {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("transferFrom(address,address,uint256)", 
             _from, _to, _tokensToTransfer)
        ));
        require(success && bytesToBool(result), "Utils: call to ERC20 contract failed (transferFrom)");
    }
    
    function transfer(address _to, uint _tokensToTransfer, address _token) external {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("transfer(address,uint256)", 
             _to, _tokensToTransfer)
        ));
        require(success && bytesToBool(result), "Utils: call to ERC20 contract failed (transfer)"); 
    }
    
    function allowance(address _from, address _to, address _token) external returns(uint256) {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("allowance(address,address)", 
             _from, _to)
        ));
        require(success, "Utils: call to ERC20 contract failed (allowance)");
        uint resultUint = bytesToUint(result);
        return resultUint;
    }
    //****************************/ End ERC20 helper functions *****************************************




    //**************  Start ERC1155 helper functions for TrustPredictToken *****************************************
   function createTokens(address _eventId, address _token) external {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("createTokens(address)", 
             _eventId)
        ));
        require(success && bytesToBool(result), "Utils: call to TrustPredictToken contract failed (createTokens)");
    }

   function mint(address _eventId, address _address, uint256 _amount, Token _selection, address _token) external {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("mint(address,address,uint256,uint8)", 
             _eventId, _address, _amount, uint8(_selection))
        ));
        require(success && bytesToBool(result), "Utils: call to TrustPredictToken contract failed (mint)");
    }

    function burn(address _eventId, address _address, uint256 _amount, Token _selection, address _token) external {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("burn(address,address,uint256,uint8)", 
             _eventId, _address, _amount, uint8(_selection))
        ));
        require(success && bytesToBool(result), "Utils: call to TrustPredictToken contract failed (burn)");
    }


    function transferFrom(address _eventId, address _from, address _to, uint256 _amount, Token _selection, address _token) external {
        (bool success, bytes memory result) = _token.call(
            (abi.encodeWithSignature("transferFrom(address,address,address,uint256,uint8)", 
             _eventId, _from, _to, _amount, uint8(_selection))
        ));
        require(success && bytesToBool(result), "Utils: call to TrustPredictToken contract failed (transferFrom)");
    }

    function getTokenBalance(address _eventId, Token _selection, address _token) public returns(uint256 result) {
        (bool success, bytes memory res) = _token.call(
            (abi.encodeWithSignature("getTokenBalance(address,uint8)", 
            _eventId, uint8(_selection))
        ));
        require(success, "Utils: call to TrustPredictToken contract failed (getTokenBalance)");
        assembly {
            result := mload(add(res, 0x20))
        }
    }

    function getTotalSupply(address _eventId, address _token) external returns(uint256 result) {
        return SafeMath.add(getTokenBalance(_eventId, Token.O, _token), getTokenBalance(_eventId, Token.IO, _token));
    }

    function balanceOfAddress(address _eventId, address _address, Token _selection, address _token) external returns(uint256 result) {
        (bool success, bytes memory res) = _token.call(
            (abi.encodeWithSignature("balanceOfAddress(address,address,uint8)", 
            _eventId, _address, uint8(_selection))
        ));
        require(success, "Utils: call to TrustPredictToken contract failed (balanceOfAddress)");
        assembly {
            result := mload(add(res, 0x20))
        }
    }

    function isApprovedForAll(address _from, address _to, address _token) external returns(bool result) {
        (bool success, bytes memory res) = _token.call(
            (abi.encodeWithSignature("isApprovedForAll(address,address)", 
            _from, _to)
        ));
        require(success, "Utils: call to TrustPredictToken contract failed (isApprovedForAll)");
        assembly {
            result := mload(add(res, 0x20))
        }
    }
    //**************** End ERC1155 helper functions for OPEventFactory *****************************************
}