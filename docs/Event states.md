events can be in various states:

- Created
- Valid
- Revokable
- Concluded
- Settled
- Void

- Once created, there is a specific time period to participate in the staking process. This will be set to 24 hours initially.
- if the minimum collateral amount for the event is reached, the event goes into the Valid state. if not, it goes into Revokable state, where the original stake can be returned to the user.
- in the valid state: tokens can be traded but no more liquidity can be added to the event.
- following the settlement time, the event goes into the concluded state.
- From here, there is a timeframe in which it can be settled.
    - for regular events, anyone can settle the event, as the function calls the oracle internally for settlement.
    - for launchpad events, the event creator must settle the event.
- if the event is not settled within an alloted period (eg. 7 days), the event goes to the Void state. Users can then withdraw the original amount staked on the event.


<img width="1524" alt="Screenshot 2021-05-10 at 16 50 44" src="https://user-images.githubusercontent.com/6988731/117643730-ea695a00-b1b2-11eb-997f-a128b9b50618.png">
