// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/ITrustPredictToken.sol";
import "./libraries/Utils.sol";

contract OPEventFactory {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ********** Start Events ***************
    event EventUpdate(address);
    // ********** End Events ***************


    // ********** Start State variables **********    
    // constants
    uint256 immutable public maxEventPeriod = 315360000;                        // max time any one event can last for (10y in seconds)
    uint256 immutable public minimumTokenAmountPerEvent = 10000000000000000000; // 10 tokens
    uint256 immutable public maxPredictionFactor = 2;                           // ie. 50% of max pot per stake (1/2 == 50%)
    //uint256 immutable public depositPeriod = (Utils.GetTest()) ? 10 : 86400;    // test: 10 seconds, otherwise: 1 day
    uint256 immutable public depositPeriod = 10;                                 // test: 10 seconds, otherwise: 1 day
    uint256 immutable public usdValuePerToken = 100;                            // value of 1 minted token in USD.
    // enums
    enum Side {Lower, Higher}

    // addresses
    IOracle            immutable public oracle;
    ITrustPredictToken immutable public trustPredictToken;
    IERC20             immutable public staking; // USD-denominated stablecoin
    
    // event data
    struct EventData {
        int256 betPrice;
        int256 settledPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 amountPerWinningToken;
        Side betSide;
        uint8 winner;
        bool eventSettled;
        address creator;
        address priceAggregator;
    }
    mapping(address => EventData) public events;

    uint256 public nonce = 1; // have to keep track of nonce independently. Used for deterministic event ID generation.
    // ********** End State variables **********    


    // ************************************ start gatekeeping functions *************************************************
    function _validBetPrice(int _betPrice) internal pure {
        // require that betPrice is > 0.
        require(_betPrice > 0,
                "OPEventFactory: Chosen bet price is negative.");
     }

    function _validEventSettlementTime(uint256 _eventSettlementTime) internal view {
        // require that event takes place within maxEventPeriod time
        require(block.timestamp.add(maxEventPeriod) > _eventSettlementTime,
                "OPEventFactory: event end is out of bounds");

        // require that event end happens after deposit period (also verifies that eventSettlement date is in the future)
        require(block.timestamp.add(depositPeriod) < _eventSettlementTime,
                "OPEventFactory: event initiation is out of bounds"); 
     }


    function _correctPredictionAmount(address _eventId, uint256 numTokensToMint, bool deployment) internal view {

        // The maximum prediction is either the total token amount / maxPredictionFactor OR minimum amount / maxPredictionFactor, whichever is higher.
        uint256 totalMinted = deployment ? 0 : trustPredictToken.getTotalSupply(_eventId);
        uint256 maximumPrediction = (totalMinted > minimumTokenAmountPerEvent) ?
                                 (totalMinted                    ).div(maxPredictionFactor) :
                                 (minimumTokenAmountPerEvent).div(maxPredictionFactor);

        require(numTokensToMint <= maximumPrediction,
               "OPEventFactory: requested token amount exceeds current valid prediction amount.");
    }   

    function _correctWeight(address _eventId, uint256 numTokensToMint, uint8 selection) internal view {
        // ensure that minting this number of tokens will result in less than 90% holdings on one side.        
        // (((selection + new) * 100) / (total + new)) <= 90.
        uint256 totalMinted = trustPredictToken.getTotalSupply(_eventId);
        uint256 nextTotal = totalMinted.add(numTokensToMint);
        uint256 amount = (nextTotal > minimumTokenAmountPerEvent) ? 
                       nextTotal : 
                       minimumTokenAmountPerEvent;

        uint256 weightSelection = trustPredictToken.getTokenBalance(_eventId, selection)
                                .add(numTokensToMint)
                                .mul(100)
                                .div(amount);

        require(weightSelection <= 90, "OPEventFactory: requested tokens would result in invalid weight on one side of the draw.");
     }


    function _minimumTimeReached(address _eventId, bool reached) internal view {
        if(reached){
            require(block.timestamp >= events[_eventId].startTime, "OPEventFactory: Event not yet started. Minting of new tokens is enabled.");
        }else {
            require(block.timestamp < events[_eventId].startTime, "OPEventFactory: Event started. Minting of new tokens is disabled.");
        }
     }
     
    function _minimumAmountReached(address _eventId, bool reached) internal view {
        uint256 totalSupply = trustPredictToken.getTotalSupply(_eventId);
        if(reached)
            require(totalSupply >= minimumTokenAmountPerEvent, "OPEventFactory: minimum amount not yet reached.");
        else
            require(totalSupply < minimumTokenAmountPerEvent, "OPEventFactory: minimum amount reached.");
     }
    
    function _isSettled(address _eventId, bool _settled) internal view {
        if(_settled)
            require(events[_eventId].eventSettled, "OPEventFactory: Event not yet settled.");
        else
            require(!events[_eventId].eventSettled, "OPEventFactory: Event settled.");
     }
    
    function _isConcluded(address _eventId, bool _concluded) internal view {
        if(_concluded)
            require(block.timestamp >= events[_eventId].endTime, "OPEventFactory: Event not yet concluded.");
        else
            require(block.timestamp < events[_eventId].endTime, "OPEventFactory: Event concluded.");
     }
    // ************************************ end gatekeeping functions ***************************************************

    constructor(IOracle _oracle, ITrustPredictToken _trustPredictToken, IERC20 _staking) {
        oracle = _oracle;
        trustPredictToken = _trustPredictToken;
        staking = _staking;
    }

    // ************************************ start external functions ****************************************************
    function createOPEvent(int betPrice, 
                           int8 betSide, 
                           uint256 eventSettlementTime,
                           uint256 numTokensToMint,
                           address priceAggregator)
            external
            returns(bool){
        _validBetPrice(betPrice);
        _validEventSettlementTime(eventSettlementTime);
        _correctPredictionAmount(address(0), numTokensToMint, true);

        // get next OPEvent ID
        address _eventId = Utils.addressFrom(address(this), nonce++);
        // set event data
        EventData memory data;
        data.betPrice = betPrice;
        data.betSide = Side(betSide);
        data.endTime = eventSettlementTime;
        data.startTime = block.timestamp.add(depositPeriod);
        data.priceAggregator = priceAggregator;
        data.creator = msg.sender;
        events[_eventId] = data;
        
        // Create event entry in TrustPredictToken.
        trustPredictToken.createTokens(_eventId);
        // Transfer staking token to this contract
        staking.transferFrom(msg.sender, address(this), convertToStakingAmount(numTokensToMint));        
        // mint tokens to sender
        trustPredictToken.mint(_eventId, msg.sender, numTokensToMint, 1);

        emit EventUpdate(_eventId);
        return true;
     }

    function stake(address _eventId, 
                   uint256 numTokensToMint, 
                   uint8 selection)
        external
        returns(bool){
        _isSettled(_eventId, false);
        _minimumTimeReached(_eventId, false);
        _correctWeight(_eventId, numTokensToMint, selection);
        _correctPredictionAmount(_eventId, numTokensToMint, false);
        
        staking.transferFrom(msg.sender, address(this), convertToStakingAmount(numTokensToMint));
        trustPredictToken.mint(_eventId, msg.sender, numTokensToMint, selection);

        emit EventUpdate(_eventId);
        return true;
     }

    function settle(address _eventId, 
                    int _settledPrice) 
        public {
        _minimumAmountReached(_eventId, true);
        _isConcluded(_eventId, true);
        _isSettled(_eventId, false);

        EventData storage eventData = events[_eventId];
        int settledPrice = (Utils.GetTest() == false) ? oracle.getLatestPrice(eventData.priceAggregator) : _settledPrice;

        if((settledPrice >= eventData.betPrice && eventData.betSide == Side.Higher) || 
           (settledPrice <  eventData.betPrice && eventData.betSide == Side.Lower)) {
            eventData.winner = 1;
        }else {
            eventData.winner = 0;
        }
        eventData.settledPrice = settledPrice;

        // next, calculate payment per winning token.
        uint256 winnerAmount = trustPredictToken.getTokenBalance(_eventId, eventData.winner);
        uint256  loserAmount = trustPredictToken.getTokenBalance(_eventId, getOtherToken(eventData.winner));

        // (loser * (10 ^ 18)) / winner (valid uint256 division)
        eventData.amountPerWinningToken = loserAmount.mul(1e18).div(winnerAmount);

        eventData.eventSettled = true;
        emit EventUpdate(_eventId);
     }
    
    function claim(address _eventId)
        external {
        // if event has not been settled yet, settle first.
        if(!events[_eventId].eventSettled){
            settle(_eventId, 0);
        }

        EventData storage eventData = events[_eventId];
        uint256 tokenHoldings = trustPredictToken.balanceOfAddress(_eventId, msg.sender, eventData.winner);
        // sender has winnings
        require(tokenHoldings > 0, "OPEventFactory: no holdings for sender in winning token.");

        // first calculate staking holdings (deposited amount of staking on winning side)
        uint256 stakingHoldings = convertToStakingAmount(tokenHoldings);

        // next, calculate winnings: give sender their portion of the loser staking pool.
        uint256 senderWinnings = stakingHoldings.mul(eventData.amountPerWinningToken).div(1e18);

        // Completed, burn winning event tokens.
        trustPredictToken.burn(_eventId, msg.sender, tokenHoldings, eventData.winner);

        // send holdings and winnings back to staker
        staking.safeTransfer(msg.sender, stakingHoldings);
        staking.safeTransfer(msg.sender, senderWinnings);

        emit EventUpdate(_eventId);
     }

    function revoke(address _eventId) 
        external {
        _minimumAmountReached(_eventId, false);
        _minimumTimeReached(_eventId, true);

        // send staking holdings back to the sending party if they have funds deposited.
        uint256 YesHoldings = trustPredictToken.balanceOfAddress(_eventId, msg.sender, 1);
        uint256 NoHoldings  = trustPredictToken.balanceOfAddress(_eventId, msg.sender, 0);
        require(YesHoldings > 0 || NoHoldings > 0, "OPEventFactory: no holdings for sender in any token.");

        if(YesHoldings > 0 && NoHoldings > 0){
            trustPredictToken.burn(_eventId, msg.sender, YesHoldings, 1);
            trustPredictToken.burn(_eventId, msg.sender,  NoHoldings, 0);
            staking.safeTransfer(msg.sender, convertToStakingAmount(YesHoldings.add(NoHoldings)));
        }
        else if(YesHoldings > 0){
            trustPredictToken.burn(_eventId, msg.sender, YesHoldings, 1);
            staking.safeTransfer(msg.sender, convertToStakingAmount(YesHoldings));
        }
        else {
            trustPredictToken.burn(_eventId, msg.sender, NoHoldings, 0);
            staking.safeTransfer(msg.sender, convertToStakingAmount(NoHoldings));
        }

        emit EventUpdate(_eventId);
     }
    // ************************************ End external functions ****************************************************
    
    // ************************************ start view functions **************************************************
    function convertToStakingAmount(uint256 optionAmount) internal pure returns(uint) {
        // assumes optionAmount is already encoded
        // 1 Yes/No Token = 100 USD
        return optionAmount.mul(usdValuePerToken);
    }

    function getOtherToken(uint8 selection) internal pure returns (uint8) {
        return (selection == 1) ? 0 : 1;
    }
   // ************************************ end view functions **************************************************
}
