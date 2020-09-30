pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Utils.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155Burnable.sol";

contract TrustPredictToken is ERC1155, ERC1155Burnable {

    // Token data
    struct TokenData {
        uint256 id;
        uint256 balance;
    }
    // OPOption data
    struct OPOption {
        TokenData OToken;
        TokenData IOToken;
        bool set;
    }
    // only store as mapping. contract address creation is deterministic so don't need to track keys.
    mapping(address => OPOption) TokenIDs;

    // ********** start modifiers ******************************
    modifier onlyEvent {
        require(msg.sender==Utils.GetOPEventFactoryAddress(),
                "TrustPredictToken: Caller is not designated OPEventFactory.");
        _;
    }
    // ********** end modifiers ******************************

    constructor(string memory uri) public ERC1155(uri) {}

    function createTokens(address _eventId, uint numTokensToMint) onlyEvent external returns(bool){
        // Create IDs for O/IO tokens.
        OPOption memory option;
        option.OToken  = TokenData(uint256(keccak256(abi.encodePacked(_eventId, Utils.Token.O))), numTokensToMint);
        option.IOToken = TokenData(uint256(keccak256(abi.encodePacked(_eventId, Utils.Token.IO))), 0);
        option.set = true;
        TokenIDs[_eventId] = option;
        return true;
    }

    function mint(address _eventId, address beneficiary, uint amount, uint8 selection) onlyEvent external returns(bool) {
        _mint(beneficiary, getTokenID(_eventId, Utils.Token(selection)), amount, "");
        // Update token balances
        TokenIDs[_eventId].OToken.balance = SafeMath.add(
                        TokenIDs[_eventId].OToken.balance, 
                        amount);
        return true;
    }

    function transferFrom(address _eventId, address from, address to, uint256 amount, uint8 selection) onlyEvent external returns(bool) {
        safeTransferFrom(from, to, getTokenID(_eventId, Utils.Token(selection)), amount, "");
        return true;
    }

    function balanceOf(address _eventId, address _address, uint8 selection) external view returns(uint256) {
        return balanceOf(_address, getTokenID(_eventId, Utils.Token(selection)));
    }

    function burn(address _eventId, address _address, uint amount, uint8 selection) onlyEvent external returns(bool) {
        _burn(_address, getTokenID(_eventId, Utils.Token(selection)), amount);
        return true;
    }


    /************** Start view functions *****************/
    function getOPEventID(address _eventId) external view returns(OPOption memory){
        return TokenIDs[_eventId];
    }

    function getTokenID(address _eventId, Utils.Token selection) private view returns (uint256){
        if(selection == Utils.Token.O)
            return TokenIDs[_eventId].OToken.id;
        else
            return TokenIDs[_eventId].IOToken.id;
    }

    function getTokenBalance(address _eventId, uint8 selection) external view returns (uint256){
        if(Utils.Token(selection) == Utils.Token.O)
            return TokenIDs[_eventId].OToken.balance;
        else
            return TokenIDs[_eventId].IOToken.balance;
    }
    /************** End view functions *****************/
}