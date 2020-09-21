// eth specific
Web3 = require('web3')
// constants
var network='https://kovan.infura.io/v3/fb44167f83e740898c90737b6ec456d8';
web3 = new Web3(network)

// Kovan ERC20 interactions
contracts = []
contract_addresses = []
contract_addresses['StableCoin'] = '0xb5f4d40279Aaa89F7F556558C789D1816C3D5122'
contract_addresses['ChainLink'] = '0xa36085F69e2889c224210F603D836748e7dC0088'

maxDecimals = 18
ethBasePrice = "36015" // 360.15. Strings for BigNumber conversion
tokenDecimals = 18
priceFeedDecimals = 8
stableCoinOptionRatio = 100
depositPeriodSeconds = 10
eventPeriodSeconds = 15

// args 
betPrice = 0
betSide = 1
eventPeriod = 2
numTokensToMint = 3

OTokenSelection = 0
IOTokenSelection = 1

Higher = 0
Lower = 1


