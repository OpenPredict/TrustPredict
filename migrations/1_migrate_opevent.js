const OPEvent    = artifacts.require("OPEvent");
const ChainLink  = artifacts.require("ChainLinkToken");
const StableCoin = artifacts.require("StableCoin");
const Web3 = require('web3');
const Utils = require('./utils.js');

module.exports = async function (deployer, network, accounts) {
    // Kovan ERC20 interactions
    web3 = new Web3("https://kovan.infura.io/v3/fb44167f83e740898c90737b6ec456d8")

    contracts = []
    contract_addresses = []
    contract_addresses['StableCoin'] = '0xb5f4d40279Aaa89F7F556558C789D1816C3D5122'
    contract_addresses['ChainLink'] = '0xa36085F69e2889c224210F603D836748e7dC0088'

    maxDecimals = 18
    ethBasePrice = "36015" // 360.15. Strings for BigNumber conversion
    tokenDecimals = 18
    priceFeedDecimals = 8
    stableCoinOptionRatio = 100

    // args 
    betPrice = 0
    betSide = 1
    eventPeriod = 2
    numTokensToMint = 3

    Higher = 0
    Lower = 1

    args = []
    args[betPrice] = Utils.EncodeTokenAmount(ethBasePrice, priceFeedDecimals, 2);
    args[betSide] = Higher
    args[eventPeriod] = 100000
    args[numTokensToMint] = Utils.EncodeTokenAmount(1, tokenDecimals, 0);

    contracts['ChainLink'] = await ChainLink.at(contract_addresses['ChainLink']);
    contracts['StableCoin'] = await StableCoin.at(contract_addresses['StableCoin']);

    nonce = await web3.eth.getTransactionCount(accounts[0]);
    OPEventAddress = Utils.getNextContractAddress(accounts[0], nonce+2)
    OracleAddress  = Utils.getNextContractAddress(OPEventAddress, 3);
    console.log("ChainLink transfer..")
    await contracts['ChainLink'].transfer(OracleAddress, Utils.EncodeTokenAmount(1, tokenDecimals, 0));
    console.log("Stablecoin approve..")
    await contracts['StableCoin'].approve(OPEventAddress, Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0));
    console.log("deploy..")
    await deployer.deploy(OPEvent, args[betPrice], args[betSide], args[eventPeriod], args[numTokensToMint]);
};