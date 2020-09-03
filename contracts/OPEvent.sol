pragma solidity ^0.6.7;
    
import "./OPOption.sol";
import "./StableCoin.sol";

contract OPEvent {
    // ********** start state vars **********
    using SafeERC20 for IERC20;
    
    // constants
    uint constant minimumTokenAmountPerEvent = 500; 
    //uint constant depositPeriod = 86400; // time to allow deposits before event start (24h in seconds)
    //uint constant maxEventPeriod = 315360000; // max time any one event can last for (10y in seconds)
    // TESTING
    uint constant depositPeriod = 1000; // time to allow deposits before event start (24h in seconds)
    uint constant maxEventPeriod = 10000; // max time any one event can last for (10y in seconds)

    // contract references
    OPOption[] tokens;
    IERC20 public stableCoin;
    //PriceConsumer priceFeed;
    
    // constructor
    uint priceConclusion;
    bool priceGreater;
    uint startTime;
    uint endTime;
    
    // decided in settle()
    Token winner;
    uint winnerPercentage;
    uint loserPercentage;
    bool eventSettled;
    
    bool firstMint = true;
    // ********** end state vars **********

    // ********** start enums **********
    enum Token {O, IO}
    // ********** end enums **********

    // ********** start modifiers *********
    modifier validEventPeriod(uint _endTime) {
        // require that event takes place within maxEventPeriod time
        require(SafeMath.add(block.timestamp, maxEventPeriod) > _endTime, 
                "OpenPredictEvent: event end is out of bounds");

        // require that event end happens after deposit period
        require(SafeMath.add(block.timestamp, depositPeriod) < _endTime, 
                "OpenPredictEvent: event initiation is out of bounds"); 
        _;
    }
    
    modifier hasGrantedAllowance(uint numTokens) {
        
        require(stableCoin.allowance(msg.sender, address(this)) == numTokens, 
                "OpenPredictEvent: stablecoin balance not granted");
        _;
    }

    modifier handleFirstDeposit(Token selection) {
        // First mint must be to O token
        if(firstMint)
            require(selection == Token.O, "OpenPredictEvent: First deposit must be of O token.");
        _;
     }
     
    modifier correctWeight(uint numTokensToMint, Token selection) {
        // ensure that minting this number of tokens will result in less than 90% on one side.
        // We enforce that the weight be >= 10% to ensure that the proper ratio is abided following the first deposit.
        if(!firstMint){
            // (((selection + new) * 100) / (total + new)) >= 10 && <= 90.
            uint newWeightSelection = SafeMath.div(
                SafeMath.mul(SafeMath.add(tokens[uint(selection)].totalSupply(), numTokensToMint), 100),
                SafeMath.add(getTotalSupply(), numTokensToMint)
            );

            require(newWeightSelection >= 10 && newWeightSelection <= 90, 
                   "OpenPredictEvent: requested tokens would result in invalid weight on selected side of the draw.");
        }
        _;
     }

    modifier minimumTimeReached(bool reached) {
        if(reached){
            require(block.timestamp >= startTime, "OpenPredictEvent: minimum time not yet reached.");
        }else {
            require(block.timestamp < startTime, "OpenPredictEvent: minimum time reached.");
        }
        _;
     }
     
    modifier minimumAmountReached(bool reached) {
        if(reached)
            require(getTotalSupply() >= minimumTokenAmountPerEvent, "OpenPredictEvent: minimum amount not yet reached.");
        else
            require(getTotalSupply() < minimumTokenAmountPerEvent, "OpenPredictEvent: minimum amount reached.");
        _;
    }
    
    modifier settled(bool _settled) {
        if(_settled)
            require(eventSettled, "OpenPredictEvent: Event not yet settled.");
        else
            require(!eventSettled, "OpenPredictEvent: Event settled.");
        _;
    }
    
    modifier concluded(bool _concluded) {
        if(_concluded)
            require(block.timestamp >= endTime, "OpenPredictEvent: Event not yet concluded.");
        else
            require(block.timestamp < endTime, "OpenPredictEvent: Event concluded.");
        _;
     }
    
    // ********** end modifiers *********

    // ********** start functions *******

    constructor(uint _priceConclusion, 
                bool _priceGreater, 
                uint _endTime)
        validEventPeriod(_endTime) 
        public 
    {
        // contract creation/references
        tokens.push(new OPOption()); // Token.O
        tokens.push(new OPOption()); // Token.IO
        //priceFeed = new PriceConsumer();
        stableCoin = IERC20(0x02eE126f76EEe5Da72f292f1da8A33CA9D794F98);

        // argument assignment
        priceConclusion = _priceConclusion;
        priceGreater = _priceGreater;
        endTime = _endTime;
        startTime = block.timestamp + depositPeriod;
    }

    function mint(uint numTokensToMint, Token selection)
        handleFirstDeposit(selection)
        settled(false)
        minimumTimeReached(false)
        correctWeight(numTokensToMint, selection) 
        hasGrantedAllowance(numTokensToMint)
        public 
    {
        tokens[uint(selection)].mint(msg.sender, numTokensToMint);
        stableCoin.safeTransferFrom(msg.sender, address(this), numTokensToMint);
        if(firstMint) firstMint = false;
    }

    function settle() 
        minimumAmountReached(true) 
        concluded(true) 
        public 
    {
        // TODO ChainLink addition to settlement function. for now set winner as O token
        winner = Token.O;
        winnerPercentage = 60;
        loserPercentage = 100 - winnerPercentage;
        eventSettled = true;
    }
    
    function claim() 
        settled(true)
        public
    {
        uint senderDeposit = tokens[uint(winner)].balanceOf(msg.sender);
        // sender has winnings
        require(senderDeposit > 0, "OpenPredictEvent: no deposit held for sender in winning token.");
        // send has granted allowance to the contract to handle the deposit
        require(tokens[uint(winner)].allowance(msg.sender, address(this)) == senderDeposit,
                "OpenPredictEvent: sender has not granted allowance for winning tokens.");
        
        // first return stablecoin holdings, burn winning event tokens (send to this contract)
        stableCoin.transfer(msg.sender, senderDeposit);
        tokens[uint(winner)].safeTransferFrom(msg.sender, address(this), senderDeposit);
        // next, distribute winnings: give sender an amount of stablecoin proportional to deposit.
        uint senderWinnings = SafeMath.mul(SafeMath.div(senderDeposit, winnerPercentage), loserPercentage);
        stableCoin.safeTransfer(msg.sender, senderWinnings);
    }

    function revoke() 
        minimumAmountReached(false) 
        minimumTimeReached(true) 
        public 
    {
        // send stablecoin holdings back to the sending party if they have funds deposited.
        uint ODeposit = tokens[uint(Token.O)].balanceOf(msg.sender);
        uint IODeposit = tokens[uint(Token.IO)].balanceOf(msg.sender);
        require(ODeposit > 0 || IODeposit > 0, "OpenPredictEvent: no deposit held for sender in any token.");

        if(ODeposit > 0){
            require(tokens[uint(Token.O)].allowance(msg.sender, address(this)) == ODeposit,
            "OpenPredictEvent: sender has not granted allowance for O tokens.");
            stableCoin.safeTransfer(msg.sender, ODeposit);
            tokens[uint(Token.O)].safeTransferFrom(msg.sender, address(this), ODeposit);
        }
        if(IODeposit > 0){
            require(tokens[uint(Token.IO)].allowance(msg.sender, address(this)) == IODeposit,
            "OpenPredictEvent: sender has not granted allowance for IO tokens.");
            stableCoin.safeTransfer(msg.sender, IODeposit);
            tokens[uint(Token.IO)].safeTransferFrom(msg.sender, address(this), IODeposit);
        }
    }
    
    
    // ********** start util functions *******
    function getOtherToken(Token selection) pure private returns (Token) {
        return (selection == Token.IO) ? Token.O : Token.IO;
    }
    
    function getTotalSupply() view public returns (uint) {
        return tokens[uint(Token.IO)].totalSupply() + tokens[uint(Token.O)].totalSupply();
    }
   // ********** end util functions *******
   
   // ********** end functions *******
}
