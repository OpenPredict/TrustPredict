pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Utils.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155Burnable.sol";

contract TrustPredictToken is ERC1155, ERC1155Burnable {

    event BalanceChange(address, address, address, uint256, uint8);

    // Token data
    struct Token {
        uint256 id;
        uint256 balance;
    }
    
    // Event data
    struct TokenPair {
        mapping(Utils.Token => Token) tokens;
        bool set;
    }
    // only store as mapping. contract address creation is deterministic so don't need to track keys.
    mapping(address => TokenPair) TokenPairs;

    // ********** start modifiers ******************************
    function _onlyEvent() internal {
        require(msg.sender==Utils.GetOPEventFactoryAddress(),
                "TrustPredictToken: Caller is not the designated OPEventFactory address.");
    }
    // ********** end modifiers ******************************

    constructor(string memory uri) public ERC1155(uri) {}

    function createTokens(address _eventId) external returns(bool){
        _onlyEvent();

        // Create IDs for Yes/No tokens.
        TokenPairs[_eventId].tokens[Utils.Token.Yes]  = Token(uint256(keccak256(abi.encodePacked(_eventId, Utils.Token.Yes))), 0);
        TokenPairs[_eventId].tokens[Utils.Token.No] = Token(uint256(keccak256(abi.encodePacked(_eventId, Utils.Token.No))), 0);
        TokenPairs[_eventId].set = true;
        return true;
    }

    function mint(address eventId, address to, uint amount, uint8 selection) external returns(bool) {
        _onlyEvent();

        _mint(to, getTokenID(eventId, Utils.Token(selection)), amount, "");
        TokenPairs[eventId].tokens[Utils.Token(selection)].balance += amount;
        emit BalanceChange(eventId, address(0), to, amount, selection);
        return true;
    }

    function burn(address eventId, address from, uint amount, uint8 selection) external returns(bool) {
        _onlyEvent();

        _burn(from, getTokenID(eventId, Utils.Token(selection)), amount);
        emit BalanceChange(eventId, from, address(0), amount, selection);
        return true;
    }

    function transferFrom(address eventId, address from, address to, uint256 amount, uint8 selection) external returns(bool) {

        safeTransferFrom(from, to, getTokenID(eventId, Utils.Token(selection)), amount, "");
        emit BalanceChange(eventId, from, to, amount, selection);
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
        return (getTokenBalance(eventId, uint8(Utils.Token.No)), 
                getTokenBalance(eventId, uint8(Utils.Token.Yes)));
    }
    /************** End view functions *****************/
}