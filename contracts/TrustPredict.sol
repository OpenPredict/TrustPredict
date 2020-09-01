pragma solidity ^0.6.7;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "./StableCoin.sol";

contract PriceConsumer {

    AggregatorInterface internal priceFeed;
  
    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0xD21912D8762078598283B14cbA40Cb4bFCb87581
     */
    constructor() public {
        priceFeed = AggregatorInterface(0xD21912D8762078598283B14cbA40Cb4bFCb87581);
    }
  
    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int256) {
        return priceFeed.latestAnswer();
    }

    /**
     * Returns the timestamp of the latest price update
     */
    function getLatestPriceTimestamp() public view returns (uint256) {
        return priceFeed.latestTimestamp();
    }
}

contract OPOption is ERC20, ERC20Burnable, Ownable {

    using SafeERC20 for IERC20;

    IERC20 private stableCoin;

    modifier hasCorrectBalance(address beneficiary, uint tokensToMint) {
       require(stableCoin.balanceOf(beneficiary) >= tokensToMint);
       _;
    }

    constructor () public ERC20("ETHUSD IO", "EUIO") {
        stableCoin = StableCoin(0xb4BBE3415b5fF41c6b78CE55cc73d72A5b349A0d);
    }

    function mint(address beneficiary, uint tokensToMint) hasCorrectBalance(beneficiary, tokensToMint) onlyOwner public {
      _mint(beneficiary, tokensToMint * (10 ** uint256(decimals())));
      stableCoin.safeTransferFrom(tx.origin, msg.sender, tokensToMint);
    }
    
    function safeTransfer(address to, uint tokensToTransfer) onlyOwner public {
      this.safeTransfer(to, tokensToTransfer);
    }

    function burn(address from, uint tokensToBurn) onlyOwner public {
      this.burn(from, tokensToBurn);
    }
}


contract OpenPredictEvent {
    // ********** start state vars **********

    // constants
    uint constant minimumTokenAmountPerEvent = 500; 
    uint constant initiationPeriod = 86400; // 24h in seconds
    uint constant maxEventPeriod = 315360000; // 10y in seconds

    address constant stableCoinAddress = 0xb4BBE3415b5fF41c6b78CE55cc73d72A5b349A0d;

    // contract references
    OPOption[] tokens;
    
    using SafeERC20 for IERC20;
    IERC20 private stableCoin;
    PriceConsumer priceFeed;
    
    // contract specific
    uint initiationTime;
    uint startTime;
    uint endTime;
    uint priceConclusion;
    bool priceGreater;
    bool eventStarted = false;
    bool eventSettled = false;
    Token winner;
    uint winnerPercentage;
    uint loserPercentage;

    // ********** end state vars **********

    // ********** start enums **********
    enum Token {O, IO}
    // ********** end enums **********

    // ********** start modifiers *********
    // TODO: need to be safeMath function calls
    modifier eventConcluded {
        require(block.timestamp >= (startTime + endTime));
        _;
     }

    modifier minimumAmountStatus(bool reached) {
        require(getMinimumAmountStatus(reached));
        _;
     }

    modifier minimumTimeStatus(bool reached) {
        if(reached){
            require(block.timestamp >= (initiationTime + initiationPeriod));
        }else {
            require(block.timestamp < (initiationTime + initiationPeriod));
        }
        _;
     }

    modifier hasCorrectBalance(uint numOTokensToCreator) {
        require(stableCoin.balanceOf(msg.sender) >= numOTokensToCreator);
        _;
     }

    
    modifier validMint(uint numTokensToMint, Token selection) {
        // ensure event has not settled
        require(!eventSettled);

        // ensure that minting this number of tokens will result in less than 90% on one side.
        require((tokens[uint(selection)].totalSupply() + numTokensToMint) < ((getTotalSupply() / 100) * 90));
        
        // ensure msg.sender has enough stablecoin to mint.
        require(stableCoin.balanceOf(msg.sender) >= numTokensToMint);

        _;
     }

    modifier eventHasStarted {
        require(eventStarted);
        _;
    }
    
    modifier eventHasSettled {
        require(eventSettled);
        _;
    }
    // ********** end modifiers *********

    // ********** start functions *******

    constructor(uint numOTokensToCreator, uint _priceConclusion, bool _priceGreater, uint _endTime) hasCorrectBalance(numOTokensToCreator) public {
        // require that event takes place within eventPeriod time
        require((block.timestamp + _endTime) < maxEventPeriod, "OpenPredictEvent: event end is out of bounds"); 
        // require that event end happens after initation period
        require((block.timestamp + _endTime) > initiationPeriod, "OpenPredictEvent: event initiation is out of bounds"); 
        // require token 

        tokens[uint(Token.O)] = new OPOption();
        tokens[uint(Token.IO)] = new OPOption();
        priceFeed = new PriceConsumer();
        stableCoin = StableCoin(stableCoinAddress);

        priceConclusion = _priceConclusion;
        priceGreater = _priceGreater;
        endTime = _endTime;
        initiationTime = block.timestamp;

        // send tokens to msg.sender
        tokens[uint(Token.O)].mint(msg.sender, numOTokensToCreator);

    }

    function mint(uint numTokensToMint, Token selection) validMint(numTokensToMint, selection) public {
        tokens[uint(selection)].mint(msg.sender, numTokensToMint);
        if(!eventStarted) checkStart();
    }

    // TODO ChainLink settlement function
    // function settle() eventHasStarted eventConcluded public {
    // }
    
    function claim() eventHasSettled public {
        uint senderDeposit = tokens[uint(winner)].balanceOf(msg.sender);
        require(senderDeposit > 0);
        // first return stablecoin holdings, burn winning event tokens
        stableCoin.safeTransfer(msg.sender, senderDeposit);
        tokens[uint(winner)].burn(msg.sender, senderDeposit);
        // next, distribute winnings: give sender an amount of stablecoin proportional to deposit.
        uint senderWinnings = (senderDeposit / winnerPercentage) * loserPercentage;
        stableCoin.safeTransfer(msg.sender, senderWinnings);
        
    }

    function revoke() minimumAmountStatus(false) minimumTimeStatus(true) public {
        // send stablecoin holdings back to the sending party if they have funds deposited.
        uint ODeposit = tokens[uint(Token.O)].balanceOf(msg.sender);
        uint IODeposit = tokens[uint(Token.IO)].balanceOf(msg.sender);
        require(ODeposit > 0 || IODeposit > 0);

        if(ODeposit > 0){
            stableCoin.safeTransfer(msg.sender, ODeposit);
            tokens[uint(Token.O)].burn(msg.sender, ODeposit);
        }
        if(IODeposit > 0){
            stableCoin.safeTransfer(msg.sender, IODeposit);
            tokens[uint(Token.IO)].burn(msg.sender, IODeposit);
        }
    }

    function checkStart() private {
        if(getMinimumAmountStatus(true)) {
             startTime = block.timestamp;
             eventStarted = true;
        }
    }

    function getOtherToken(Token selection) pure private returns (Token) {
        return (selection == Token.IO) ? Token.O : Token.IO;
    }
    
    function getTotalSupply() view private returns (uint) {
        return tokens[uint(Token.IO)].totalSupply() + tokens[uint(Token.O)].totalSupply();
    }

    function getMinimumAmountStatus(bool reached) view private returns (bool) {
        if(reached){
            return getTotalSupply() >= minimumTokenAmountPerEvent;
        }else {
            return getTotalSupply() < minimumTokenAmountPerEvent;
        }
     }
   // ********** end functions *******
}
