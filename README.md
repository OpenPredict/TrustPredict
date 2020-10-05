# Installation
`npm install`
`truffle compile`


# Run tests + Create Coverage Report
```
truffle run coverage --network development
open coverage/index.html
```

# Run Tests standalone
`chmod +x dotenv` to give permissions to bash `dotenv` script

In one terminal, run `ganache-cli --mnemonic "$(./dotenv get MNEMONIC)"`

In another, run `truffle test --network development`

You will need to restart the Ganance server every time the last command is to be executed as the test runner is deterministic ( the coverage command does this by default).



