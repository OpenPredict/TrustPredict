pragma solidity ^0.6.0;
    
import "./Utils.sol";

contract OPEvent {
    // ********** start state vars **********
    event Result(bytes _bytes, uint _uint);
    event Address(address _address);
    
    // constants
    uint minimumTokenAmountPerEvent = Utils.GetMinimumTokenAmountPerEvent(); // 500 * 10^18 (50,000 USD)
    uint depositPeriod = Utils.GetDepositPeriod(); // time to allow deposits before event start (24h in seconds)
    uint constant maxEventPeriod = 315360000; // max time any one event can last for (10y in seconds)

    // addresses
    address _oracle = Utils.GetOracleAddress();
    address _factory = Utils.GetOPEventFactoryAddress();
    
    // constructor
    int betPrice;
    Side betSide;
    uint startTime;
    uint endTime;
    address priceAggregator;

    // decided in settle()
    int settledPrice;
    Utils.Token winner;
    bool eventSettled;
    uint amountPerWinningToken;
    // ********** end state vars **********

    // ********** start enums **********
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
        require(Utils.allowance(msg.sender, address(this), Utils.GetOPUSDAddress()) ==  numTokens, 
                "OpenPredictEvent: OPUSD balance not granted");
        _;
    }
     
    modifier correctWeight(uint numTokensToMint, Utils.Token selection) {
        // ensure that minting this number of tokens will result in less than 90% holdings on one side.
        // We also enforce that the weight be >= 10% to ensure that the proper ratio is held following the first deposit.
        
        // (((selection + new) * 100) / (total + new)) >= 10 && <= 90.
        uint newWeightSelection = SafeMath.div(
            SafeMath.mul(SafeMath.add(Utils.getTokenBalance(selection, _factory), numTokensToMint), 100),
            SafeMath.add(Utils.getTotalSupply(_factory), numTokensToMint)
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
        uint totalSupply = Utils.getTotalSupply(_factory);
        if(reached)
            require(totalSupply >= minimumTokenAmountPerEvent, "OpenPredictEvent: minimum amount not yet reached.");
        else
            require(totalSupply < minimumTokenAmountPerEvent, "OpenPredictEvent: minimum amount reached.");
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

    constructor(int _betPrice, 
                int8 _betSide, 
                uint _eventPeriod,
                address _priceAggregator)
        validEventPeriod(_eventPeriod)
        public 
    {
        // argument assignment
        betPrice = _betPrice;
        betSide = Side(_betSide);
        endTime = block.timestamp + _eventPeriod;
        startTime = block.timestamp + depositPeriod;
        priceAggregator = _priceAggregator;
        
        // contract creation/references
        Utils.newRequest(endTime + 2 minutes, priceAggregator, _oracle); // give the oracle callback some leeway
        //string memory pairing = Utils.getPairing(priceAggregator, _oracle);
    }

    // ************************************ start external functions ****************************************************
    function wager(uint numTokensToMint, Utils.Token selection)
        settled(false)
        minimumTimeReached(false)
        correctWeight(numTokensToMint, selection) 
        hasGrantedAllowance(Utils.convertToOPUSDAmount(numTokensToMint))
        external 
    {
        Utils.mint(msg.sender, numTokensToMint, selection, _factory);
        Utils.transferFrom(msg.sender, address(this), Utils.convertToOPUSDAmount(numTokensToMint), Utils.GetOPUSDAddress());
    }

    function settle(int _settledPrice) 
        minimumAmountReached(true) 
        concluded(true)
        settled(false)
        external
    {
        
        settledPrice = Utils.compare("kovan", Utils.GetNetwork()) ? Utils.getLatestPrice(priceAggregator, _oracle) : _settledPrice;

        if((settledPrice >= betPrice &&  betSide == Side.Higher) || 
           (settledPrice <  betPrice &&  betSide == Side.Lower)) {
            winner = Utils.Token.O;
        }else {
            winner = Utils.Token.IO;
        }
        
        // next, calculate payment per winning token.
        uint winnerAmount = Utils.getTokenBalance(winner, _factory);
        uint  loserAmount = Utils.getTokenBalance(getOtherToken(winner), _factory);
        
        // (loser * (10 ^ 18)) / winner (valid uint division)
        amountPerWinningToken = SafeMath.div(
            loserAmount * (10**18),
            winnerAmount
        );
        eventSettled = true;
    }
    
    function claim() 
        settled(true)
        external
    {
        uint tokenHoldings = Utils.balanceOf(msg.sender, winner, _factory);
        // sender has winnings
        require(tokenHoldings > 0, "OpenPredictEvent: no holdings for sender in winning token.");
        // sender has granted allowance to the contract to handle the deposit
        require(Utils.isApprovedForAll(msg.sender, address(this), _factory),
                "OpenPredictEvent: sender has not granted allowance for tokens.");
        
        // first return OPUSD holdings (deposited amount of OPUSD on winning side)
        uint OPUSDHoldings = Utils.convertToOPUSDAmount(tokenHoldings);
        Utils.transfer(msg.sender, OPUSDHoldings, Utils.GetOPUSDAddress()); 

        // next, distribute winnings: give sender their portion of the loser OPUSD pool.
        uint senderWinnings = SafeMath.div(
            SafeMath.mul(OPUSDHoldings, amountPerWinningToken),
            10 ** 18
        );
        Utils.transfer(msg.sender, senderWinnings, Utils.GetOPUSDAddress());

        // Completed, burn winning event tokens.
        Utils.burn(msg.sender, tokenHoldings, winner, _factory);
    }

    function revoke() 
        minimumAmountReached(false) 
        minimumTimeReached(true) 
        external 
    {
        // send OPUSD holdings back to the sending party if they have funds deposited.
        uint OHoldings = Utils.balanceOf(msg.sender, Utils.Token.O, _factory);
        uint IOHoldings = Utils.balanceOf(msg.sender, Utils.Token.IO, _factory);
        require(OHoldings > 0 || IOHoldings > 0, "OpenPredictEvent: no holdings for sender in any token.");

        require(Utils.isApprovedForAll(msg.sender, address(this), _factory),
        "OpenPredictEvent: sender has not granted allowance for tokens.");

        if(OHoldings > 0){
            Utils.transfer(msg.sender, Utils.convertToOPUSDAmount(OHoldings), Utils.GetOPUSDAddress());
            Utils.burn(msg.sender, OHoldings, Utils.Token.O, _factory);
        }
        if(IOHoldings > 0){
            Utils.transfer(msg.sender, Utils.convertToOPUSDAmount(IOHoldings), Utils.GetOPUSDAddress());
            Utils.burn(msg.sender, IOHoldings, Utils.Token.IO, _factory);
        }
    }
    // ************************************ start external functions ****************************************************
    
    


    // ************************************ start local util functions **************************************************
    function getOtherToken(Utils.Token selection) pure private returns (Utils.Token) {
        return (selection == Utils.Token.O) ? Utils.Token.IO : Utils.Token.O;
    }
   
    function getBetPrice() view external returns(int) {
       return betPrice;
    }
    
    function getBetSide() view external returns(Side) {
       return betSide;
    }
    
    function getStartTime() view external returns(uint) {
       return startTime;
    }
    
    function getEndTime() view external returns(uint) {
       return endTime;
    }
    
    function getWinner() settled(true) view external returns(Utils.Token){
       return winner;
    }
    
    function getAmountPerWinningToken() settled(true) view external returns(uint) {
       return amountPerWinningToken;
    }
    
    function getSettledPrice() settled(true) view external returns(int) {
       return settledPrice;
    }

    function getEventSettled() view external returns(bool) {
       return eventSettled;
    }
   // ************************************ end local util functions **************************************************
}
