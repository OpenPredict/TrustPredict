pragma solidity ^0.6.0;
    
import "./OPOption.sol";
import "./Oracle.sol";

contract OPEvent is Ownable {
    // ********** start state vars **********
    using SafeERC20 for IERC20;
    
    event Result(bytes _bytes, uint _uint);
    event Address(address _address);
    
    // constants
    //uint constant minimumTokenAmountPerEvent = 500000000000000000000; // 500 * 10^18 (50,000 USD)
    //uint constant depositPeriod = 86400; // time to allow deposits before event start (24h in seconds)
    //uint constant maxEventPeriod = 315360000; // max time any one event can last for (10y in seconds)
    // TESTING
    uint constant minimumTokenAmountPerEvent = 1000000000000000000; // 500 * 10^18 (50,000 USD)
    uint constant depositPeriod = 1000; // time to allow deposits before event start (24h in seconds)
    uint constant maxEventPeriod = 2000; // max time any one event can last for (10y in seconds)
    
    address constant stableCoin = 0xb5f4d40279Aaa89F7F556558C789D1816C3D5122;
    
    // contract references
    OPOption[] tokens;
    Oracle oracle;
    
    // constructor
    int betPrice;
    Side betSide;
    uint startTime;
    uint endTime;

    // decided in settle()
    int settledPrice;
    Token winner;
    bool eventSettled;
    uint amountPerWinningToken;
    // ********** end state vars **********

    // ********** start enums **********
    enum Token {O, IO}
    enum Side {Higher, Lower}
    // ********** end enums **********

    // ********** start modifiers *********
    modifier validEventPeriod(uint _eventPeriod) {
        // require that event takes place within maxEventPeriod time
        uint _endTime = SafeMath.add(block.timestamp, _eventPeriod);
        require(SafeMath.add(block.timestamp, maxEventPeriod) > _endTime, 
                "OpenPredictEvent: event end is out of bounds");

        // require that event end happens after deposit period
        require(SafeMath.add(block.timestamp, depositPeriod) < _endTime, 
                "OpenPredictEvent: event initiation is out of bounds"); 
        _;
    }
    
    modifier hasGrantedAllowance(uint numTokens) {
        require(allowance(msg.sender, address(this)) ==  numTokens, 
                "OpenPredictEvent: stablecoin balance not granted.");
        _;
    }
     
    modifier correctWeight(uint numTokensToMint, Token selection) {
        // ensure that minting this number of tokens will result in less than 90% holdings on one side.
        // We also enforce that the weight be >= 10% to ensure that the proper ratio is held following the first deposit.
        
        // (((selection + new) * 100) / (total + new)) >= 10 && <= 90.
        uint newWeightSelection = SafeMath.div(
            SafeMath.mul(SafeMath.add(tokens[uint(selection)].totalSupply(), numTokensToMint), 100),
            SafeMath.add(getTotalSupply(), numTokensToMint)
        );

        require(newWeightSelection >= 10 && newWeightSelection <= 90, 
               "OpenPredictEvent: requested tokens would result in invalid weight on one side of the draw.");
        _;
     }

    modifier minimumTimeReached(bool reached) {
        if(reached){
            require(block.timestamp >= startTime, "OpenPredictEvent: Event not yet started. Minting of new tokens is enabled.");
        }else {
            require(block.timestamp < startTime, "OpenPredictEvent: Event started. Minting of new tokens is disabled.");
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

    constructor(int _betPrice, 
                Side _betSide, 
                uint _eventPeriod,
                uint numTokensToMint)
        validEventPeriod(_eventPeriod)
        hasGrantedAllowance(convertToStableCoinAmount(numTokensToMint))
        public 
    {
        // argument assignment
        betPrice = _betPrice;
        betSide = _betSide;
        endTime = block.timestamp + _eventPeriod;
        startTime = block.timestamp + depositPeriod;
        
        // contract creation/references
        tokens.push(new OPOption("ETHUSD O Token", "EUO")); // Token.O
        tokens.push(new OPOption("ETHUSD IO Token", "EUIO")); // Token.IO
        oracle = new Oracle(endTime + 2 minutes); // give the oracle callback some leeway
        
        // mint tokens
        tokens[uint(Token.O)].mint(msg.sender, numTokensToMint);
        transferFrom(msg.sender, address(this), convertToStableCoinAmount(numTokensToMint));
    }

    function mint(uint numTokensToMint, Token selection)
        settled(false)
        minimumTimeReached(false)
        correctWeight(numTokensToMint, selection) 
        hasGrantedAllowance(numTokensToMint)
        public 
    {
        tokens[uint(selection)].mint(msg.sender, numTokensToMint);
        transferFrom(msg.sender, address(this), convertToStableCoinAmount(numTokensToMint));
    }

    function settle() 
        minimumAmountReached(true) 
        concluded(true)
        settled(false)
        public
    {
        settledPrice = oracle.getLatestPrice();
        if((settledPrice >= betPrice &&  betSide == Side.Higher) || 
           (settledPrice <  betPrice &&  betSide == Side.Lower)) {
            winner = Token.O;
        }else {
            winner = Token.IO;
        }
        
        // next, calculate payment per winning token.
        uint winnerAmount = tokens[   uint(winner)      ].totalSupply();
        uint  loserAmount = tokens[getOtherToken(winner)].totalSupply();
        
        // (loser * (10 ^ 18)) / winner (valid uint division)
        amountPerWinningToken = SafeMath.div(
            loserAmount * (10 ** uint256(tokens[uint(Token.O)].decimals())),
            winnerAmount
        );
        eventSettled = true;
    }
    
    function claim() 
        settled(true)
        public
    {
        uint tokenHoldings = tokens[uint(winner)].balanceOf(msg.sender);
        // sender has winnings
        require(tokenHoldings > 0, "OpenPredictEvent: no deposit held for sender in winning token.");
        // sender has granted allowance to the contract to handle the deposit
        require(tokens[uint(winner)].allowance(msg.sender, address(this)) == tokenHoldings,
                "OpenPredictEvent: sender has not granted allowance for winning tokens.");
        
        // first return stablecoin holdings, burn winning event tokens (send to this contract)
        uint stableCoinHoldings = convertToStableCoinAmount(tokenHoldings);
        transfer(msg.sender, stableCoinHoldings);
        tokens[uint(winner)].transferFrom(msg.sender, address(this), tokenHoldings);
        
        // next, distribute winnings: give sender their portion of the loser stablecoin pool.
        uint senderWinnings = SafeMath.div(
            SafeMath.mul(stableCoinHoldings, amountPerWinningToken),
            10 ** uint256(tokens[uint(Token.O)].decimals())
        );
        transfer(msg.sender, senderWinnings);
    }

    function revoke() 
        minimumAmountReached(false) 
        minimumTimeReached(true) 
        public 
    {
        // send stablecoin holdings back to the sending party if they have funds deposited.
        uint OHoldings = tokens[uint(Token.O)].balanceOf(msg.sender);
        uint IOHoldings = tokens[uint(Token.IO)].balanceOf(msg.sender);
        require(OHoldings > 0 || IOHoldings > 0, "OpenPredictEvent: no deposit held for sender in any token.");

        if(OHoldings > 0){
            require(tokens[uint(Token.O)].allowance(msg.sender, address(this)) == OHoldings,
            "OpenPredictEvent: sender has not granted allowance for O tokens.");
            transfer(msg.sender, convertToStableCoinAmount(OHoldings));
            tokens[uint(Token.O)].transferFrom(msg.sender, address(this), OHoldings);
        }
        if(IOHoldings > 0){
            require(tokens[uint(Token.IO)].allowance(msg.sender, address(this)) == IOHoldings,
            "OpenPredictEvent: sender has not granted allowance for IO tokens.");
            transfer(msg.sender, convertToStableCoinAmount(IOHoldings));
            tokens[uint(Token.IO)].transferFrom(msg.sender, address(this), IOHoldings);
        }
    }
    
    
    // ********** start util functions *******
    function getOtherToken(Token selection) pure private returns (uint) {
        return (selection == Token.O) ? uint(Token.IO) : uint(Token.O);
    }
    
    function getTotalSupply() view public returns (uint) {
        return SafeMath.add(tokens[uint(Token.IO)].totalSupply(), 
                            tokens[uint( Token.O)].totalSupply());
    }
    
    function bytesToUint(bytes memory _bytes) internal pure returns (uint256) {
        require(_bytes.length >= 32, "Read out of bounds");
        uint256 result;
        assembly {
            result := mload(add(_bytes, 0x20))
        }
        return result;
    }
    
    // StableCoin helper functions
    function transferFrom(address _from, address _to, uint _tokensToTransfer) private  {
        (bool success, bytes memory result) = stableCoin.call(
            (abi.encodeWithSignature("transferFrom(address,address,uint256)", 
             _from, _to, _tokensToTransfer)
        ));
        require(success, "OpenPredictEvent: call to stableCoin contract failed (transferFrom)");
    }
    
    function transfer(address _to, uint _tokensToTransfer) private {
        (bool success, bytes memory result) = stableCoin.call(
            (abi.encodeWithSignature("transfer(address,uint256)", 
             _to, _tokensToTransfer)
        ));
        require(success, "OpenPredictEvent: call to stableCoin contract failed (transfer)"); 
    }
    
    function allowance(address _from, address _to) private returns(uint256) {
        emit Address(_from);
        emit Address(_to);
        (bool success, bytes memory result) = stableCoin.call(
            (abi.encodeWithSignature("allowance(address,address)", 
             _from, _to)
        ));
        require(success, "OpenPredictEvent: call to stableCoin contract failed (allowance)");
        uint resultUint = bytesToUint(result);
        emit Result(result, resultUint);
        return resultUint;
    }

    function convertToStableCoinAmount(uint optionAmount) private pure returns(uint) {
        // assumes optionAmount is already encoded
        // 1 O/IO token = 100 USD
        return SafeMath.mul(optionAmount, 100);
    }
   
   // ********** end util functions *******
   
   // ******  start view functions ******
    function getTokenAddress(Token selection) view public returns(address) {
        return address(tokens[uint(selection)]);
   }
   
    function getOracleAddress() view public returns(address) {
        return address(oracle);
   }
   
    function getBetPrice() view public returns(int) {
       return betPrice;
    }
    
    function getBetSide() view public returns(Side) {
       return betSide;
    }
    
    function getStartTime() view public returns(uint) {
       return startTime;
    }
    
    function getEndTime() view public returns(uint) {
       return endTime;
    }
    
    function getWinner() settled(true) view public returns(Token){
       return winner;
    }
    
    function getAmountPerWinningToken() settled(true) view public returns(uint) {
       return amountPerWinningToken;
    }
    
    function getSettledPrice() settled(true) view public returns(int) {
       return settledPrice;
    }

    function getEventSettled() view public returns(bool) {
       return eventSettled;
   }
   // ****** end view functions ******
   
  // ********** end functions *******
}
