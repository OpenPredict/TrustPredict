pragma solidity ^0.6.0;
    
import "./Utils.sol";

contract OPEventFactory {
    // ********** start state vars **********    
    // constants
    uint constant maxEventPeriod = 315360000; // max time any one event can last for (10y in seconds)

    // addresses
    address _oracle = Utils.GetOracleAddress();
    address _factory = Utils.GetOPEventFactoryAddress();
    
    // constructor
    struct EventData {
        int betPrice;
        Utils.Side betSide;
        uint startTime;
        uint endTime;
        address priceAggregator;
        int settledPrice;
        Utils.Token winner;
        bool eventSettled;
        uint amountPerWinningToken;
    }
    mapping(address => EventData) events;

    uint nonce; // have to keep track of nonce independently. Used for event ID generation.

    EventData tempData;

    // ********** end state vars **********

    // ********** start modifiers *********
    modifier setData(address eventId) {
        tempData = events[eventId];
        _;
    }

    modifier validEventPeriod(uint _eventPeriod) {
        // require that event takes place within maxEventPeriod time
        uint _endTime = SafeMath.add(block.timestamp, _eventPeriod);
        require(SafeMath.add(block.timestamp, maxEventPeriod) > _endTime, 
                "OpenPredictEvent: event end is out of bounds");

        // require that event end happens after deposit period
        require(SafeMath.add(block.timestamp, Utils.GetDepositPeriod()) < _endTime, 
                "OpenPredictEvent: event initiation is out of bounds"); 
        _;
    }
    
    modifier hasGrantedAllowance(uint numTokens) {
        require(Utils.allowance(msg.sender, address(this), Utils.GetOPUSDAddress()) ==  numTokens, 
                "OpenPredictEvent: OPUSD balance not granted");
        _;
    }
     
    modifier correctWeight(address _eventId, uint numTokensToMint, Utils.Token selection) {
        // ensure that minting this number of tokens will result in less than 90% holdings on one side.
        // We also enforce that the weight be >= 10% to ensure that the proper ratio is held following the first deposit.
        
        // (((selection + new) * 100) / (total + new)) >= 10 && <= 90.
        uint newWeightSelection = SafeMath.div(
            SafeMath.mul(SafeMath.add(Utils.getTokenBalance(_eventId, selection, _factory), numTokensToMint), 100),
            SafeMath.add(Utils.getTotalSupply(_eventId, _factory), numTokensToMint)
        );

        require(newWeightSelection >= 10 && newWeightSelection <= 90, 
               "OpenPredictEvent: requested tokens would result in invalid weight on one side of the draw.");
        _;
     }

    modifier minimumTimeReached(bool reached) {
        if(reached){
            require(block.timestamp >= tempData.startTime, "OpenPredictEvent: Event not yet started. Minting of new tokens is enabled.");
        }else {
            require(block.timestamp < tempData.startTime, "OpenPredictEvent: Event started. Minting of new tokens is disabled.");
        }
        _;
     }
     
    modifier minimumAmountReached(address _eventId, bool reached) {
        uint totalSupply = Utils.getTotalSupply(_eventId, Utils.GetTrustPredictAddress());
        if(reached)
            require(totalSupply >= Utils.GetMinimumTokenAmountPerEvent(), "OpenPredictEvent: minimum amount not yet reached.");
        else
            require(totalSupply < Utils.GetMinimumTokenAmountPerEvent(), "OpenPredictEvent: minimum amount reached.");
        _;
    }
    
    modifier settled(bool _settled) {
        if(_settled)
            require(tempData.eventSettled, "OpenPredictEvent: Event not yet settled.");
        else
            require(!tempData.eventSettled, "OpenPredictEvent: Event settled.");
        _;
    }
    
    modifier concluded(bool _concluded) {
        if(_concluded)
            require(block.timestamp >= tempData.endTime, "OpenPredictEvent: Event not yet concluded.");
        else
            require(block.timestamp < tempData.endTime, "OpenPredictEvent: Event concluded.");
        _;
     }
    
    // ********** end modifiers *********

    function createOPEvent(int _betPrice, 
                           int8 _betSide, 
                           uint _eventPeriod,
                           uint numTokensToMint,
                           address _priceAggregator)
            hasGrantedAllowance(Utils.convertToOPUSDAmount(numTokensToMint)) 
            external 
    {
        // get next OPEvent ID
        address OPEventID = Utils.addressFrom(address(this), ++nonce);
        // set event data
        EventData memory data;
        data.betPrice = _betPrice;
        data.betSide = Utils.Side(_betSide);
        data.endTime = block.timestamp + _eventPeriod;
        data.startTime = block.timestamp + Utils.GetDepositPeriod();
        data.priceAggregator = _priceAggregator;
        events[OPEventID] = data;

        // Create Oracle request. give the callback some leeway
        Utils.newRequest(data.endTime + 2 minutes, _priceAggregator, _oracle, OPEventID); 
        
        // Create event entry in TrustPredictToken.
        Utils.createTokens(OPEventID, numTokensToMint, Utils.GetTrustPredictAddress());
        // Transfer OPUSD to this contract
        Utils.transferFrom(msg.sender, address(this), Utils.convertToOPUSDAmount(numTokensToMint), Utils.GetOPUSDAddress());        
        // mint tokens to sender
        Utils.mint(OPEventID, msg.sender, numTokensToMint, Utils.Token.O, Utils.GetTrustPredictAddress());
    }

    // ************************************ start external functions ****************************************************
    function wager(address eventId, uint numTokensToMint, Utils.Token selection)
        setData(eventId)
        settled(false)
        minimumTimeReached(false)
        correctWeight(eventId, numTokensToMint, selection) 
        hasGrantedAllowance(Utils.convertToOPUSDAmount(numTokensToMint))
        external 
    {
        Utils.transferFrom(msg.sender, address(this), Utils.convertToOPUSDAmount(numTokensToMint), Utils.GetOPUSDAddress());
        Utils.mint(eventId, msg.sender, numTokensToMint, selection, _factory);
    }

    function settle(address _eventId, int _settledPrice) 
        setData(_eventId)
        minimumAmountReached(_eventId, true) 
        concluded(true)
        settled(false)
        external
    {
        EventData memory data = events[_eventId];
        int settledPrice = Utils.compare("kovan", Utils.GetNetwork()) ? Utils.getLatestPrice(data.priceAggregator, _oracle) : _settledPrice;

        if((settledPrice >= data.betPrice &&  data.betSide == Utils.Side.Higher) || 
           (settledPrice <  data.betPrice &&  data.betSide == Utils.Side.Lower)) {
            data.winner = Utils.Token.O;
        }else {
            data.winner = Utils.Token.IO;
        }
        
        // next, calculate payment per winning token.
        uint winnerAmount = Utils.getTokenBalance(_eventId, data.winner, _factory);
        uint  loserAmount = Utils.getTokenBalance(_eventId, Utils.getOtherToken(data.winner), _factory);
        
        // (loser * (10 ^ 18)) / winner (valid uint division)
        data.amountPerWinningToken = SafeMath.div(
            loserAmount * (10**18),
            winnerAmount
        );
        data.eventSettled = true;
    }
    
    function claim(address _eventId)
        setData(_eventId)
        settled(true)
        external
    {
        EventData memory data = events[_eventId];
        uint tokenHoldings = Utils.balanceOf(_eventId, msg.sender, data.winner, _factory);
        // sender has winnings
        require(tokenHoldings > 0, "OpenPredictEvent: no holdings for sender in winning token.");
        // sender has granted allowance to the contract to handle the deposit
        require(Utils.isApprovedForAll(msg.sender, address(this), Utils.GetTrustPredictAddress()),
                "OpenPredictEvent: sender has not granted allowance for tokens.");
        
        // first return OPUSD holdings (deposited amount of OPUSD on winning side)
        uint OPUSDHoldings = Utils.convertToOPUSDAmount(tokenHoldings);
        Utils.transfer(msg.sender, OPUSDHoldings, Utils.GetOPUSDAddress()); 

        // next, distribute winnings: give sender their portion of the loser OPUSD pool.
        uint senderWinnings = SafeMath.div(
            SafeMath.mul(OPUSDHoldings, data.amountPerWinningToken),
            10 ** 18
        );
        Utils.transfer(msg.sender, senderWinnings, Utils.GetOPUSDAddress());

        // Completed, burn winning event tokens.
        Utils.burn(_eventId, msg.sender, tokenHoldings, data.winner, _factory);
    }

    function revoke(address _eventId) 
        setData(_eventId)
        minimumAmountReached(_eventId, false) 
        minimumTimeReached(true) 
        external 
    {
        // send OPUSD holdings back to the sending party if they have funds deposited.
        uint OHoldings = Utils.balanceOf(_eventId, msg.sender, Utils.Token.O, _factory);
        uint IOHoldings = Utils.balanceOf(_eventId, msg.sender, Utils.Token.IO, _factory);
        require(OHoldings > 0 || IOHoldings > 0, "OpenPredictEvent: no holdings for sender in any token.");

        require(Utils.isApprovedForAll(msg.sender, address(this), _factory),
        "OpenPredictEvent: sender has not granted allowance for tokens.");

        if(OHoldings > 0){
            Utils.transfer(msg.sender, Utils.convertToOPUSDAmount(OHoldings), Utils.GetOPUSDAddress());
            Utils.burn(_eventId, msg.sender, OHoldings, Utils.Token.O, _factory);
        }
        if(IOHoldings > 0){
            Utils.transfer(msg.sender, Utils.convertToOPUSDAmount(IOHoldings), Utils.GetOPUSDAddress());
            Utils.burn(_eventId, msg.sender, IOHoldings, Utils.Token.IO, _factory);
        }
    }
    // ************************************ start external functions ****************************************************
    
    


    // ************************************ start local util functions **************************************************
    function getBetPrice(address _eventId) view external returns(int) {

       return events[_eventId].betPrice;
    }
    
    function getBetSide(address _eventId) view external returns(Utils.Side) {

       return events[_eventId].betSide;
    }
    
    function getStartTime(address _eventId) view external returns(uint) {

       return events[_eventId].startTime;
    }
    
    function getEndTime(address _eventId) view external returns(uint) {

       return events[_eventId].endTime;
    }
    
    function getWinner(address _eventId) settled(true) view external returns(Utils.Token){

       return events[_eventId].winner;
    }
    
    function getAmountPerWinningToken(address _eventId) settled(true) view external returns(uint) {

       return events[_eventId].amountPerWinningToken;
    }
    
    function getSettledPrice(address _eventId) settled(true) view external returns(int) {

       return events[_eventId].settledPrice;
    }

    function getEventSettled(address _eventId) view external returns(bool) {

       return events[_eventId].eventSettled;
    }
   // ************************************ end local util functions **************************************************
}
