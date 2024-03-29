
# Setup

`npm install`

`truffle compile`

`ganache-cli --mnemonic -d --gasLimit 0xBEBC20`

## Development

Start Ganache server fresh, and run
```
truffle migrate --network development
```

`cd frontend`

`npm i && npm run dev`

In the browser:

- navigate to `http://localhost:8100/`

- Open MetaMask:

-- `Import Account`

-- paste the following private key (has all the necessary tokens): `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d`

-- Connect to `Localhost 8545`

## Kovan deployment
`mv .env.example .env`
- replace `PRIVATE_KEY` and `INFURA_KEY` with your keys.

## Run tests + Create Coverage Report

```

truffle run coverage --network development

open coverage/index.html

```

## Run Tests standalone

Start Ganache server fresh, and run

```
truffle test --network development
```

## Caveats

- Apart from the coverage case, You will need to restart the Ganache server every time, as the test runner is deterministic.

- If you recompile and re-migrate the contracts, you need to reset MetaMask, otherwise it doesn't change networks (in Chrome at least). The easiest thing to do is close the app, switch networks to eg. Mainnet, switch back to `localhost 8545`, and re-open the app.


## Documentation

- see `/docs`.
- `api.md` gives extended info on each function in the application.
- `event_states.md` describes (and shows an infographic) of how speculation events pass through different states during their lifetime.