// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/ITrustPredictToken.sol";
import "./libraries/Utils.sol";

contract OPEventFactory is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ********** Start Events ***************
    event EventUpdate(address);

    event Initialize(uint256, uint256, uint256, uint256, uint256);
    // ********** End Events ***************


    // ********** Start State variables **********    
    // constants
    uint256 immutable public maxEventPeriod;             // max time any one event can last for.
    uint256 immutable public minimumTokenAmountPerEvent; // minimum tokens needed to be minted for event start
    uint256 immutable public maxPredictionFactor;        // ie. percentage of max pot per stake. eg for 50%, value should be 2 (1/2 == 50%)
    uint256 immutable public depositPeriod;              // length of time during which the event can be staked on.
    uint256 immutable public conclusionTime;             // Time in which the event can be settled post conclusion. if not settled within this time, allow users to withdraw stake.
    // enums
    enum Side {Lower, Higher}
    enum Type { Regular, Prelaunch }

    // addresses
    IOracle            immutable public oracle;
    ITrustPredictToken immutable public trustPredictToken;
    
    // event data
    struct EventData {
        int256 betPrice;
        int256 settledPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 amountPerWinningToken;
        Side betSide;
        Type betType;
        uint8 winner;
        bool eventSettled;
        address creator;
        address priceAggregator;
        IERC20 asset;
    }

    struct Asset {
        IERC20 _address;       // address of the collateralized asset.
        uint256 valuePerToken; // value of 1 minted ERC1155 token in the collateralized asset.
        bool set;              // if this asset is valid for collateral.
    }

    mapping(address => EventData) public events;  // mapping of eventID to events.
    mapping(address => bool)      public admins;  // whitelisted admins who can create prelaunch events.
    mapping(IERC20 => Asset)      public assets;  // The ERC20 collateralized assets that can be used for predictions in an event.

    uint256 public nonce = 1; // have to keep track of nonce independently. Used for deterministic event ID generation.
    // ********** End State variables **********    


    // ************************************ start gatekeeping functions *************************************************

    function _validCreator() internal view {
        // require that calling address is whitelisted to create events.
        require(admins[msg.sender],
                "OPEventFactory: Prelaunch event creator is not whitelisted.");
     }

    function _validAsset(IERC20 asset) internal view {
        // require that calling address is whitelisted to create events.
        require(assets[asset].set,
                "OPEventFactory: Chosen asset is not whitelist.");
     }

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
                                 (totalMinted               ).div(maxPredictionFactor) :
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

    function _isVoid(address _eventId, bool _void) internal view {
        if(_void){
            require(block.timestamp >= events[_eventId].endTime.add(conclusionTime), "OPEventFactory: Event not yet voided.");
        }else {
            require(block.timestamp < events[_eventId].endTime.add(conclusionTime), "OPEventFactory: Event voided.");
        }
     }
    // ************************************ end gatekeeping functions ***************************************************

    constructor(IOracle _oracle, 
                ITrustPredictToken _trustPredictToken,
                IERC20 initialAsset,
                uint256 _maxEventPeriod,
                uint256 _minimumTokenAmountPerEvent,
                uint256 _maxPredictionFactor,
                uint256 _depositPeriod,
                uint256 _valuePerToken,
                uint256 _conclusionTime
    ) {
        oracle = _oracle;
        trustPredictToken = _trustPredictToken;
        maxEventPeriod = _maxEventPeriod;
        minimumTokenAmountPerEvent = _minimumTokenAmountPerEvent;
        maxPredictionFactor = _maxPredictionFactor;
        depositPeriod = _depositPeriod;
        conclusionTime = _conclusionTime;
        assets[initialAsset] = Asset({
            _address: initialAsset,
            valuePerToken: _valuePerToken,
            set: true
        });
        emit Initialize(_maxEventPeriod, _minimumTokenAmountPerEvent, _maxPredictionFactor, _depositPeriod, _valuePerToken);
    }

    // ************************************ start external functions ****************************************************
    function createOPEvent(int betPrice, 
                           int8 betSide, 
                           uint256 eventSettlementTime,
                           uint256 numTokensToMint,
                           address priceAggregator,
                           IERC20 asset)
            external
            returns(bool){
        _validBetPrice(betPrice);
        _validAsset(asset);
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
        data.betType = Type.Regular;
        data.asset = asset;
        events[_eventId] = data;
        
        // Create event entry in TrustPredictToken.
        trustPredictToken.createTokens(_eventId);
        // Transfer asset token to this contract
        asset.transferFrom(msg.sender, address(this), convertToStakingAmount(numTokensToMint, assets[asset].valuePerToken));        
        // mint tokens to sender
        trustPredictToken.mint(_eventId, msg.sender, numTokensToMint, 1);

        emit EventUpdate(_eventId);
        return true;
     }

    function createPrelaunchEvent(int betPrice,
                                  IERC20 asset,
                                  uint256 eventSettlementTime)
            external
            returns(bool){
        _validCreator();
        _validAsset(asset);
        _validBetPrice(betPrice);
        _validEventSettlementTime(eventSettlementTime);

        // get next OPEvent ID
        address _eventId = Utils.addressFrom(address(this), nonce++);
        // set event data
        EventData memory data;
        data.betPrice = betPrice;
        data.betSide = Side.Higher;
        data.endTime = eventSettlementTime;
        data.startTime = block.timestamp.add(depositPeriod);
        data.creator = msg.sender;
        data.betType = Type.Prelaunch;
        data.asset = asset;
        events[_eventId] = data;

        // Create event entry in TrustPredictToken.
        trustPredictToken.createTokens(_eventId);

        emit EventUpdate(_eventId);
        return true;
     }

    function stake(address _eventId, 
                   uint256 numTokensToMint, 
                   uint8 selection)
        external
        returns(bool){
        _isSettled(_eventId, false);
        _isVoid(_eventId, false);
        _minimumTimeReached(_eventId, false);
        _correctWeight(_eventId, numTokensToMint, selection);
        _correctPredictionAmount(_eventId, numTokensToMint, false);

        EventData storage eventData = events[_eventId];
        
        eventData.asset.transferFrom(msg.sender, address(this), convertToStakingAmount(numTokensToMint, assets[eventData.asset].valuePerToken));
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
        _isVoid(_eventId, false);

        EventData storage eventData = events[_eventId];
        // int settledPrice = (Utils.GetTest() == false) ? oracle.getLatestPrice(eventData.priceAggregator) : _settledPrice;

        int settledPrice;
        if(eventData.betType == Type.Prelaunch){
             require(eventData.creator == msg.sender, "settle: attempt to settle prelaunch event from account other than creator.");
            settledPrice = _settledPrice;
        }else {
            settledPrice = (Utils.GetTest() == false) ? oracle.getLatestPrice(eventData.priceAggregator) : _settledPrice;
        }

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
        EventData storage eventData = events[_eventId];
        if(!events[_eventId].eventSettled){
            settle(_eventId, 0);
        }
        
        uint256 tokenHoldings = trustPredictToken.balanceOfAddress(_eventId, msg.sender, eventData.winner);
        // sender has winnings
        require(tokenHoldings > 0, "OPEventFactory: no holdings for sender in winning token.");

        // first calculate asset holdings (deposited amount of asset on winning side)
        uint256 assetHoldings = convertToStakingAmount(tokenHoldings, assets[eventData.asset].valuePerToken);

        // next, calculate winnings: give sender their portion of the loser asset pool.
        uint256 senderWinnings = assetHoldings.mul(eventData.amountPerWinningToken).div(1e18);

        // Completed, burn winning event tokens.
        trustPredictToken.burn(_eventId, msg.sender, tokenHoldings, eventData.winner);

        // send holdings and winnings back to staker
        eventData.asset.safeTransfer(msg.sender, assetHoldings);
        eventData.asset.safeTransfer(msg.sender, senderWinnings);

        emit EventUpdate(_eventId);
     }

    function revokableWithdraw(address _eventId)
        external {
        _minimumAmountReached(_eventId, false);
        _minimumTimeReached(_eventId, true);
        _isVoid(_eventId, false);

        EventData storage eventData = events[_eventId];

        // send staking holdings back to the sending party if they have funds deposited.
        uint256 YesHoldings = trustPredictToken.balanceOfAddress(_eventId, msg.sender, 1);
        uint256 NoHoldings  = trustPredictToken.balanceOfAddress(_eventId, msg.sender, 0);
        uint256 valuePerToken = assets[eventData.asset].valuePerToken;
        require(YesHoldings > 0 || NoHoldings > 0, "OPEventFactory: no holdings for sender in any token.");

        if(YesHoldings > 0 && NoHoldings > 0){
            trustPredictToken.burn(_eventId, msg.sender, YesHoldings, 1);
            trustPredictToken.burn(_eventId, msg.sender,  NoHoldings, 0);
            eventData.asset.safeTransfer(msg.sender, convertToStakingAmount(YesHoldings.add(NoHoldings), valuePerToken));
        }
        else if(YesHoldings > 0){
            trustPredictToken.burn(_eventId, msg.sender, YesHoldings, 1);
            eventData.asset.safeTransfer(msg.sender, convertToStakingAmount(YesHoldings, valuePerToken));
        }
        else {
            trustPredictToken.burn(_eventId, msg.sender, NoHoldings, 0);
            eventData.asset.safeTransfer(msg.sender, convertToStakingAmount(NoHoldings, valuePerToken));
        }

        emit EventUpdate(_eventId);
     }

    // in the case of emergency, ie. a valid event concluded but not settled within the alloted time,
    // allow users to withdraw their original stake.
    function voidWithdraw(address _eventId) 
        external {
        _isConcluded(_eventId, true);
        _isSettled(_eventId, false);
        _isVoid(_eventId, true);

        EventData storage eventData = events[_eventId];

        // send staking holdings back to the sending party if they have funds deposited.
        uint256 YesHoldings = trustPredictToken.balanceOfAddress(_eventId, msg.sender, 1);
        uint256 NoHoldings  = trustPredictToken.balanceOfAddress(_eventId, msg.sender, 0);
        uint256 valuePerToken = assets[eventData.asset].valuePerToken;
        require(YesHoldings > 0 || NoHoldings > 0, "OPEventFactory: no holdings for sender in any token.");

        if(YesHoldings > 0 && NoHoldings > 0){
            trustPredictToken.burn(_eventId, msg.sender, YesHoldings, 1);
            trustPredictToken.burn(_eventId, msg.sender,  NoHoldings, 0);
            eventData.asset.safeTransfer(msg.sender, convertToStakingAmount(YesHoldings.add(NoHoldings), valuePerToken));
        }
        else if(YesHoldings > 0){
            trustPredictToken.burn(_eventId, msg.sender, YesHoldings, 1);
            eventData.asset.safeTransfer(msg.sender, convertToStakingAmount(YesHoldings, valuePerToken));
        }
        else {
            trustPredictToken.burn(_eventId, msg.sender, NoHoldings, 0);
            eventData.asset.safeTransfer(msg.sender, convertToStakingAmount(NoHoldings, valuePerToken));
        }

        emit EventUpdate(_eventId);
     }

    // allow contract admin to update admin list.
    function updateAdmins(address _admin, bool isWhitelisted) 
        external
        onlyOwner {
            admins[_admin] = isWhitelisted;
     }

    // allow contract admin to update asset list.
    function updateAssets(IERC20 _asset, uint256 valuePerToken, bool set) 
        external
        onlyOwner {
        assets[_asset] = Asset({
            _address: _asset,
            valuePerToken: valuePerToken,
            set: set
        });
     }
    // ************************************ End external functions ****************************************************
    
    // ************************************ start view functions **************************************************
    function convertToStakingAmount(uint256 optionAmount, uint256 valuePerToken) internal pure returns(uint) {
        // 1 Yes/No Token = 'valuePerToken' amount of the collateralized asset.
        return optionAmount.mul(valuePerToken).div(1e18);
    }

    function getOtherToken(uint8 selection) internal pure returns (uint8) {
        return (selection == 1) ? 0 : 1;
    }
   // ************************************ end view functions **************************************************
}
