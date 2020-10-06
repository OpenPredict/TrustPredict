pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
    
import "./Utils.sol";

contract OPEventFactory {
    // ********** Events ***************

    event EventUpdate(address);

    // ********** start state vars **********    
    // constants
    uint constant maxEventPeriod = 315360000; // max time any one event can last for (10y in seconds)

    // addresses
    address _oracle = Utils.GetOracleAddress();
    address _token = Utils.GetTrustPredictAddress();
    
    // event data
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

    uint nonce; // have to keep track of nonce independently. Used for deterministic event ID generation.

    // ********** start gatekeeping functions *********
    function _validEventPeriod(uint _eventPeriod) view internal {
        // require that event takes place within maxEventPeriod time
        uint _endTime = SafeMath.add(block.timestamp, _eventPeriod);
        require(SafeMath.add(block.timestamp, maxEventPeriod) > _endTime, 
                "OPEventFactory: event end is out of bounds");

        // require that event end happens after deposit period
        require(SafeMath.add(block.timestamp, Utils.GetDepositPeriod()) < _endTime, 
                "OPEventFactory: event initiation is out of bounds"); 
    }
    
    function _hasGrantedAllowance(uint numTokens) internal {
        require(Utils.allowance(msg.sender, address(this), Utils.GetOPUSDAddress()) ==  numTokens, 
                "OPEventFactory: OPUSD balance not granted");
    }
     
    function _correctWeight(address _eventId, uint numTokensToMint, Utils.Token selection) internal {
        // ensure that minting this number of tokens will result in less than 90% holdings on one side.
        // We also enforce that the weight be >= 10% to ensure that the proper ratio is held following the first deposit.
        
        // (((selection + new) * 100) / (total + new)) >= 10 && <= 90.
        uint newWeightSelection = SafeMath.div(
            SafeMath.mul(SafeMath.add(Utils.getTokenBalance(_eventId, selection, _token), numTokensToMint), 100),
            SafeMath.add(Utils.getTotalSupply(_eventId, _token), numTokensToMint)
        );

        require(newWeightSelection >= 10 && newWeightSelection <= 90, 
               "OPEventFactory: requested tokens would result in invalid weight on one side of the draw.");
     }

    function _minimumTimeReached(address _eventId, bool reached) view internal {
        if(reached){
            require(block.timestamp >= events[_eventId].startTime, "OPEventFactory: Event not yet started. Minting of new tokens is enabled.");
        }else {
            require(block.timestamp < events[_eventId].startTime, "OPEventFactory: Event started. Minting of new tokens is disabled.");
        }
     }
     
    function _minimumAmountReached(address _eventId, bool reached) internal {
        uint totalSupply = Utils.getTotalSupply(_eventId, Utils.GetTrustPredictAddress());
        if(reached)
            require(totalSupply >= Utils.GetMinimumTokenAmountPerEvent(), "OPEventFactory: minimum amount not yet reached.");
        else
            require(totalSupply < Utils.GetMinimumTokenAmountPerEvent(), "OPEventFactory: minimum amount reached.");
    }
    
    function _isSettled(address _eventId, bool _settled) view internal {
        if(_settled)
            require(events[_eventId].eventSettled, "OPEventFactory: Event not yet settled.");
        else
            require(!events[_eventId].eventSettled, "OPEventFactory: Event settled.");
    }
    
    function _isConcluded(address _eventId, bool _concluded) view internal {
        if(_concluded)
            require(block.timestamp >= events[_eventId].endTime, "OPEventFactory: Event not yet concluded.");
        else
            require(block.timestamp < events[_eventId].endTime, "OPEventFactory: Event concluded.");
     }
    
    // ********** end gatekeeping functions *********

    function createOPEvent(int _betPrice, 
                           int8 _betSide, 
                           uint _eventPeriod,
                           uint numTokensToMint,
                           address _priceAggregator)
            external 
    {
        _validEventPeriod(_eventPeriod);
        _hasGrantedAllowance(Utils.convertToOPUSDAmount(numTokensToMint));

        // get next OPEvent ID
        address _eventId = Utils.addressFrom(address(this), ++nonce);
        // set event data
        EventData memory data;
        data.betPrice = _betPrice;
        data.betSide = Utils.Side(_betSide);
        data.endTime = block.timestamp + _eventPeriod;
        data.startTime = block.timestamp + Utils.GetDepositPeriod();
        data.priceAggregator = _priceAggregator;
        events[_eventId] = data;

        // Create Oracle request. give the callback some leeway
        Utils.newRequest(data.endTime + 2 minutes, _priceAggregator, _oracle, _eventId); 
        
        // Create event entry in TrustPredictToken.
        Utils.createTokens(_eventId, _token);
        // Transfer OPUSD to this contract
        Utils.transferFrom(msg.sender, address(this), Utils.convertToOPUSDAmount(numTokensToMint), Utils.GetOPUSDAddress());        
        // mint tokens to sender
        Utils.mint(_eventId, msg.sender, numTokensToMint, Utils.Token.O, _token);

        emit EventUpdate(_eventId);
    }

    // ************************************ start external functions ****************************************************
    function stake(address eventId, uint numTokensToMint, Utils.Token selection)
        external 
    {
        _isSettled(eventId, false);
        _minimumTimeReached(eventId, false);
        _correctWeight(eventId, numTokensToMint, selection);
        _hasGrantedAllowance(Utils.convertToOPUSDAmount(numTokensToMint));

        Utils.transferFrom(msg.sender, address(this), Utils.convertToOPUSDAmount(numTokensToMint), Utils.GetOPUSDAddress());
        Utils.mint(eventId, msg.sender, numTokensToMint, selection, _token);
    }

    function settle(address _eventId, int _settledPrice) 
        external
    {
        _minimumAmountReached(_eventId, true);
        _isConcluded(_eventId, true);
        _isSettled(_eventId, false);

        EventData storage data = events[_eventId];
        int settledPrice = Utils.compare("kovan", Utils.GetNetwork()) ? Utils.getLatestPrice(data.priceAggregator, _oracle) : _settledPrice;

        if((settledPrice >= data.betPrice &&  data.betSide == Utils.Side.Higher) || 
           (settledPrice <  data.betPrice &&  data.betSide == Utils.Side.Lower)) {
            data.winner = Utils.Token.O;
        }else {
            data.winner = Utils.Token.IO;
        }
        
        // next, calculate payment per winning token.
        uint winnerAmount = Utils.getTokenBalance(_eventId, data.winner, _token);
        uint  loserAmount = Utils.getTokenBalance(_eventId, Utils.getOtherToken(data.winner), _token);
        
        // (loser * (10 ^ 18)) / winner (valid uint division)
        data.amountPerWinningToken = SafeMath.div(
            loserAmount * (10**18),
            winnerAmount
        );
        data.eventSettled = true;

        emit EventUpdate(_eventId);
    }
    
    function claim(address _eventId)
        external
    {
        _isSettled(_eventId, true);

        EventData storage data = events[_eventId];
        uint tokenHoldings = Utils.balanceOfAddress(_eventId, msg.sender, data.winner, _token);
        // sender has winnings
        require(tokenHoldings > 0, "OPEventFactory: no holdings for sender in winning token.");
        // sender has granted allowance to the contract to handle the deposit
        require(Utils.isApprovedForAll(msg.sender, address(this), Utils.GetTrustPredictAddress()),
                "OPEventFactory: sender has not granted allowance for tokens.");
        
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
        Utils.burn(_eventId, msg.sender, tokenHoldings, data.winner, _token);

        emit EventUpdate(_eventId);
    }

    function revoke(address _eventId) 
        external 
    {
        _minimumAmountReached(_eventId, false);
        _minimumTimeReached(_eventId, true);

        // send OPUSD holdings back to the sending party if they have funds deposited.
        uint OHoldings = Utils.balanceOfAddress(_eventId, msg.sender, Utils.Token.O, _token);
        uint IOHoldings = Utils.balanceOfAddress(_eventId, msg.sender, Utils.Token.IO, _token);
        require(OHoldings > 0 || IOHoldings > 0, "OPEventFactory: no holdings for sender in any token.");

        require(Utils.isApprovedForAll(msg.sender, address(this), _token),
        "OPEventFactory: sender has not granted allowance for tokens.");

        if(OHoldings > 0){
            Utils.transfer(msg.sender, Utils.convertToOPUSDAmount(OHoldings), Utils.GetOPUSDAddress());
            Utils.burn(_eventId, msg.sender, OHoldings, Utils.Token.O, _token);
        }
        if(IOHoldings > 0){
            Utils.transfer(msg.sender, Utils.convertToOPUSDAmount(IOHoldings), Utils.GetOPUSDAddress());
            Utils.burn(_eventId, msg.sender, IOHoldings, Utils.Token.IO, _token);
        }

        emit EventUpdate(_eventId);
    }
    // ************************************ start external functions ****************************************************
    
    


    // ************************************ start local util functions **************************************************
    function getEventData(address _eventId) view public returns(EventData memory) {
        return events[_eventId];
    }

    function getNonce() view external returns(uint256) {
       return nonce;
    }
   // ************************************ end local util functions **************************************************
}
