// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustPredictToken is Ownable, ERC1155 {

    using SafeMath for uint256;

    event BalanceChange(address, address, address, uint256, uint8);

    mapping(address => bool) factories;

    // Token data
    struct Token {
        uint256 id;
        uint256 balance;
    }
    
    // Event data
    struct TokenPair {
        mapping(uint8 => Token) tokens;
        bool set;
    }
    // only store as mapping. contract address creation is deterministic so don't need to track keys.
    mapping(address => TokenPair) TokenPairs;

    // ********** start modifiers ******************************
    function _onlyEvent() internal view {
        require(factories[msg.sender],
                "TrustPredictToken: Caller is not the designated OPEventFactory address.");
    }
    // ********** end modifiers ******************************

    constructor() ERC1155("") {}

    // allow contract owner to set a factory, which can create tokens for events.
    function setFactory(address _OPEventFactory, bool set) external onlyOwner {
        factories[_OPEventFactory] = set;
    }

    function createTokens(address _eventId) external returns(bool){
        _onlyEvent();

        // Create IDs for Yes/No tokens.
        TokenPairs[_eventId].tokens[1] = Token(uint256(keccak256(abi.encodePacked(_eventId, uint8(1)))), 0);
        TokenPairs[_eventId].tokens[0] = Token(uint256(keccak256(abi.encodePacked(_eventId, uint8(0)))), 0);
        TokenPairs[_eventId].set = true;
        return true;
    }

    function mint(address eventId, address to, uint256 amount, uint8 selection) external returns(bool) {
        _onlyEvent();

        _mint(to, getTokenID(eventId, selection), amount, "");
        TokenPairs[eventId].tokens[selection].balance += amount;
        emit BalanceChange(eventId, address(0), to, amount, selection);
        return true;
    }

    function burn(address eventId, address from, uint256 amount, uint8 selection) external returns(bool) {
        _onlyEvent();

        _burn(from, getTokenID(eventId, selection), amount);
        emit BalanceChange(eventId, from, address(0), amount, selection);
        return true;
    }

    function transferFrom(address eventId, address from, address to, uint256 amount, uint8 selection) external returns(bool) {
        safeTransferFrom(from, to, getTokenID(eventId, selection), amount, "");
        emit BalanceChange(eventId, from, to, amount, selection);
        return true;
    }

    function balanceOfAddress(address eventId, address _address, uint8 selection) view external returns(uint256) {
        Token memory _token = getToken(eventId, selection);
        return balanceOf(_address, _token.id);
    }

    /************** Start view functions *****************/
    function getTokenID(address eventId, uint8 selection) public view returns (uint256){
        return TokenPairs[eventId].tokens[selection].id;
    }

    function getToken(address eventId, uint8 selection) public view returns(Token memory){
        return TokenPairs[eventId].tokens[selection];
    }

    function getTokenBalance(address eventId, uint8 selection) external view returns (uint256){
        return TokenPairs[eventId].tokens[selection].balance;
    }

    function getTokenBalances(address eventId) external view returns (uint256, uint256){
        return ((TokenPairs[eventId].tokens[0].balance), 
                (TokenPairs[eventId].tokens[1].balance));
    }

    function getTotalSupply(address _eventId) external view returns(uint256) {
        return TokenPairs[_eventId].tokens[1].balance.add(
               TokenPairs[_eventId].tokens[0].balance);
    }
    /************** End view functions *****************/
}