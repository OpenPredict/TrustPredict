
# Setup

`npm install`

`truffle compile`

`chmod +x dotenv` to give permissions to bash `dotenv` script

`ganache-cli --mnemonic "$(./dotenv get MNEMONIC)"`

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

-- paste the following private key (has all the necessary tokens): `0x75f0a9433419ab2c5369dac3f4ad67a54f343ce8aa29864976b88a884cd020a6`

-- Connect to `Localhost 8545`

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