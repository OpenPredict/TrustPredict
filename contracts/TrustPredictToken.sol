pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Utils.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155Burnable.sol";

contract TrustPredictToken is ERC1155, ERC1155Burnable {

    event Id(uint256);

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

    function mint(address _eventId, address beneficiary, uint amount, uint8 selection) external returns(bool) {
        onlyEvent();

        _mint(beneficiary, getTokenID(_eventId, Utils.Token(selection)), amount, "");
        TokenPairs[_eventId].tokens[Utils.Token(selection)].balance += amount;
        return true;
    }

    function transferFrom(address _eventId, address from, address to, uint256 amount, uint8 selection) external returns(bool) {
        onlyEvent();

        safeTransferFrom(from, to, getTokenID(_eventId, Utils.Token(selection)), amount, "");
        return true;
    }

    function balanceOfAddress(address _eventId, address _address, uint8 selection) external returns(uint256) {
        Token memory _token = getToken(_eventId, selection);
        emit Id(_token.id);
        return balanceOf(_address, _token.id);
    }

    function burn(address _eventId, address _address, uint amount, uint8 selection) external returns(bool) {
        onlyEvent();

        _burn(_address, getTokenID(_eventId, Utils.Token(selection)), amount);
        return true;
    }


    /************** Start view functions *****************/
    function getTokenID(address _eventId, Utils.Token selection) internal view returns (uint256){
        return TokenPairs[_eventId].tokens[selection].id;
    }

    function getToken(address _eventId, uint8 selection) public view returns(Token memory){
        return TokenPairs[_eventId].tokens[Utils.Token(selection)];
    }

    function getTokenBalance(address _eventId, uint8 selection) external view returns (uint256){
        return TokenPairs[_eventId].tokens[Utils.Token(selection)].balance;
    }
    /************** End view functions *****************/
}