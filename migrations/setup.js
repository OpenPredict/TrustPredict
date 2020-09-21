// common deps
var fs = require('fs')
sleep = require('sleep')
require.extensions['.sol'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
fresh = require('import-fresh');
versioning = require('npm-install-version');
Promise = require('promise');

// eth specific
Web3 = require('web3')
rlp = require('rlp')
keccak = require('keccak')
solc = versioning.require('solc@0.6.7')

// constants
//var network='https://kovan.infura.io/v3/fb44167f83e740898c90737b6ec456d8';
var network='http://localhost:8545'
web3 = new Web3(network)
privateKey = "18f53bff05faa130eb987e6a29c5956df1f2ebc71499d6757a935daa558e454e"
web3.eth.accounts[0] = web3.eth.accounts.privateKeyToAccount(privateKey)
sendingAddress = web3.eth.accounts[0].address
workRoot = "/Users/tadhgriordan/Documents/Work/OpenPredict/GitHub/"
project = workRoot.concat('TrustPredict/')
contractName = "OPEvent.sol"

// Kovan ERC20 interactions
StableCoin = 'StableCoin'
ChainLink = 'ChainLink'
OPEvent = 'OPEvent'
contract_data = []
contract_addresses = []
contracts = []
transactions = []
receipts = []
methods = []
contract_addresses[StableCoin] = '0xb5f4d40279Aaa89F7F556558C789D1816C3D5122'
contract_addresses[ChainLink] = '0xa36085F69e2889c224210F603D836748e7dC0088'
contract_data[StableCoin] = require(project.concat('build/contracts/StableCoin.json'))
contract_data[ChainLink] = require(project.concat('build/contracts/ChainLinkToken.json'))
contract_data[OPEvent] = require(project.concat('build/contracts/OPEvent.json'))
contracts[StableCoin] = new web3.eth.Contract(contract_data[StableCoin].abi, contract_addresses[StableCoin])
contracts[ChainLink] = new web3.eth.Contract(contract_data[ChainLink].abi, contract_addresses[ChainLink])
contracts[OPEvent] = new web3.eth.Contract(contract_data[OPEvent].abi)


maxDecimals = 18
ethBasePrice = "36015" // 360.15. Strings for BigNumber conversion
tokenDecimals = 18
priceFeedDecimals = 8
stableCoinOptionRatio = 100
depositPeriodSeconds = 10
eventPeriodSeconds = 15

// args 
args = []
betPrice = 0
betSide = 1
eventPeriod = 2
numTokensToMint = 3

OTokenSelection = 0
IOTokenSelection = 1

Higher = 0
Lower = 1


