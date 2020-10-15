pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Utils.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155Burnable.sol";

contract TrustPredictToken is ERC1155, ERC1155Burnable {

    event TransferFrom(address, address, address, uint256, uint8);

    // Token data
    struct Token {
        uint256 id;
        uint256 balance;
    }

    uint test = 0;

    // Event data
    struct TokenPair {
        mapping(Utils.Token => Token) tokens;
        bool set;
    }
    // only store as mapping. contract address creation is deterministic so don't need to track keys.
    mapping(address => TokenPair) TokenPairs;

    // ********** start modifiers ******************************
    function onlyEvent() internal view {
        require(msg.sender==Utils.GetOPEventFactoryAddress(),
                "TrustPredictToken: Caller is not designated OPEventFactory.");
    }
    // ********** end modifiers ******************************

    constructor(string memory uri) public ERC1155(uri) {}

    function createTokens(address _eventId) external returns(bool){
        onlyEvent();

        // Create IDs for O/IO tokens.
        TokenPairs[_eventId].tokens[Utils.Token.O]  = Token(uint256(keccak256(abi.encodePacked(_eventId, Utils.Token.O))), 0);
        TokenPairs[_eventId].tokens[Utils.Token.IO] = Token(uint256(keccak256(abi.encodePacked(_eventId, Utils.Token.IO))), 0);
        TokenPairs[_eventId].set = true;
        return true;
    }

    function mint(address eventId, address beneficiary, uint amount, uint8 selection) external returns(bool) {
        onlyEvent();

        _mint(beneficiary, getTokenID(eventId, Utils.Token(selection)), amount, "");
        TokenPairs[eventId].tokens[Utils.Token(selection)].balance += amount;
        return true;
    }

    function burn(address eventId, address _address, uint amount, uint8 selection) external returns(bool) {
        onlyEvent();

        _burn(_address, getTokenID(eventId, Utils.Token(selection)), amount);
        return true;
    }

    function transferFrom(address eventId, address from, address to, uint256 amount, uint8 selection) external returns(bool) {

        safeTransferFrom(from, to, getTokenID(eventId, Utils.Token(selection)), amount, "");
        emit TransferFrom(eventId, from, to, amount, selection);
        return true;
    }

    function balanceOfAddress(address eventId, address _address, uint8 selection) view external returns(uint256) {
        Token memory _token = getToken(eventId, selection);
        return balanceOf(_address, _token.id);
    }

    /************** Start view functions *****************/
    function getTokenID(address eventId, Utils.Token selection) internal view returns (uint256){
        return TokenPairs[eventId].tokens[selection].id;
    }

    function getToken(address eventId, uint8 selection) public view returns(Token memory){
        return TokenPairs[eventId].tokens[Utils.Token(selection)];
    }

    function getTokenBalance(address eventId, uint8 selection) public view returns (uint256){
        return TokenPairs[eventId].tokens[Utils.Token(selection)].balance;
    }

    function getTokenBalances(address eventId) external view returns (uint, uint){
        return (getTokenBalance(eventId, uint8(Utils.Token.O)), 
                getTokenBalance(eventId, uint8(Utils.Token.IO)));
    }
    /************** End view functions *****************/
}