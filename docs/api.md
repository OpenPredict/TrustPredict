
## API for TrustPredict application

See the [litepaper](https://openpredict.io/litepaper) for overview of the system.
  

### OPEventFactory.sol

- This is the main entry point of the application.

  

#### Constructor
-----------
Initialize the contract.

##### Arguments:

- `IOracle _oracle`

	- Address of the oracle contract

- `ITrustPredictToken _trustPredictToken`

	- Address of the TrustPredictToken contract
	 
- `IERC20 _initialAsset`
	- The initial collateralized asset to be used be the contract (ie. to be used to create predictions). The contract admin can add nore assets via the `updateAssets` function.

- `uint256 _maxEventPeriod`

	- The maximum amount of time an event can last for.

- `uint256 _minimumTokenAmountPerEvent`

	- minimum tokens needed to be minted for the event to go into the Valid state.

- `uint256 _maxPredictionFactor`

	- factor used to control the maximum prediction allowed.
	- eg. if this value is 10, the max prediction can be no greater than 1/10th of the current amount of tokens minted for speculation.

- `uint256 _depositPeriod`
	- length of time during which the event can be staked on, ie. in which it is in the Created state.

- `uint256 _valuePerToken`
	- value of 1 minted ERC1155 token in the initial collateralized asset. The contract admin can add nore assets via the `updateAssets` function.

- `uint256 _conclusionTime`
	- Time in which the event can be settled post conclusion (ie. until it proceeds to the Settled or Void state).
	- If not settled within this time, allow users to withdraw stake.

  

#### createOPEvent
-------------

- Allows any party to create a speculation based on a select group of asset pair. These assets resolve based on one of the ChainLink oracles specified.
- The party must also mint some initial tokens. This requires granting allowance to the contract before calling this function.

Event state before:

-	\-

Event state after:
- Created

##### Arguments:

`int betPrice`
- The asset pair price at settlement time must be greater than or lower than this value.

`int8 betSide`
- whether or not the price will be higher or lower than the bet price. Chosen side here will resolve for the Yes token.

`uint256 eventSettlementTime`
- time of event settlement, specified in seconds.

`uint256 numTokensToMint`
- number of ERC1155 Yes tokens to mint. The user must grant allowance of `_valuePerToken * numTokensToMint` of the collateralized asset to the contract.

`address priceAggregator`
	- chosen asset pair. This address resolves to one of the oracle contracts in the `Oracle.sol` contract. So this
	argument decides which asset pair the user is specifying.

`IERC20 asset`
    - the chosen asset to use for speculations.

 
#### createPrelaunchEvent
--------------------

- Allows a whitelisted address to create a special "prelaunch" event. These events are generally the same as regular events, however they are settled by the event creator, and not by an on-chain oracle. Generally the creator is a pool or launchpad project that creates events for tokens they are launching.
- The event creator can be an external address or a contract; ie. an onchain DAO that decides on the outcome between themselves.
- It is not necessary for creators of these event types to mint some initial tokens.

Arguments:

- `int betPrice`
	- The asset pair price at settlement time must be greater than or lower than this value.

- `uint256 eventSettlementTime`
	- time of event settlement, specified in seconds. The creator can only settle the event after this time.

#### stake
-----

Speculate on a chosen event.

Event state(s) before:

- Valid

Event state(s) after:

- Valid

Arguments:

`address _eventId`

- ID of chosen event.

`uint256 numTokensToMint`

- number of ERC1155 tokens to mint. The user must grant allowance of `_valuePerToken * numTokensToMint` of the collateralized asset to the contract.

`uint8 selection`

Whether to mint Yes tokens or No tokens.

#### settle
------
Settle the outcome of an event.

Event state(s) before:

- Concluded

Event state(s) after:

- Settled

Arguments:

`address _eventId`

ID of chosen event.

`int _settledPrice`

Price of the event at settlement. has no effect if the event bet type is `Regular`; `settledPrice` will come from the oracle in this case. So it only has effect for `Prelaunch` events, of which only the event creator can settle.

#### claim
-------------

Allows user to claim any due winnings, if they exist.

Event state(s) before:

- Settled

Event state(s) after:

- Settled

Arguments:

`address _eventId`

- ID of chosen event.
  

#### revokableWithdraw
-----------------

Allows user to return any staked tokens, should the event not go into the Valid state.

Event state(s) before:

- Settled

Event state(s) after:

- Settled

Arguments:

`address _eventId`

- ID of chosen event.

#### voidWithdraw
------------

Allows user to return any staked tokens, should the event not go into the Void state. (Internally this function is identical to `revokableWithdraw`, however due to the gatekeeping function structure it is clearer to have two different functions).

Event state(s) before:

- Void

Event state(s) after:

- Void

Arguments:

`address _eventId`

- ID of chosen event.

#### updateAdmins
-------

Allow the contract owner to update the admin whitelist.

`address _admin`
	- admin address to update whitelist in.
`isWhitelisted`
	- boolean to set if the `_admin` is whitelisted or not.

#### updateAssets
-------

Allow the contract owner to update the assets whitelist.

`IERC20 _asset`
	- asset address to update whitelist in.
`isWhitelisted`
	- boolean to set if the `_asset` is whitelisted or not.