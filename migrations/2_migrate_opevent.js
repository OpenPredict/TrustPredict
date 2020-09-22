const OPEvent    = artifacts.require("OPEvent");
const ChainLink  = artifacts.require("ChainLinkToken");
const StableCoin = artifacts.require("StableCoin");
const Utils = require('../utils.js');

module.exports = async function (deployer, network, accounts) {
    if(network != "development"){
        let Constants = Utils.Constants
        console.log("Creating constructor argument list..")
        args = [] 
        args[Constants.betPrice] = Utils.EncodeTokenAmount(Constants.ethBasePrice, Constants.priceFeedDecimals, 2);
        args[Constants.betSide] = Constants.Higher
        args[Constants.eventPeriod] = Constants[network].eventPeriodSeconds
        args[Constants.numTokensToMint] = Utils.EncodeTokenAmount(Constants.numTokens, Constants.tokenDecimals, 0);
    
        console.log("Getting contract address and Oracle address for setup transactions..")
        nonce = await Constants[network].web3.eth.getTransactionCount(accounts[0]);
        OPEventAddress = Utils.getNextContractAddress(accounts[0], nonce+2)
        OracleAddress  = Utils.getNextContractAddress(OPEventAddress, 3);
    
        console.log("ChainLink transfer..")
        contracts = []
        contracts['ChainLink'] = await ChainLink.at(Constants.contractAddresses.ChainLink);
        contracts['StableCoin'] = await StableCoin.at(Constants.contractAddresses.StableCoin);
    
        await contracts['ChainLink'].transfer(OracleAddress, 
                                              Utils.EncodeTokenAmount(Constants.numTokens, 
                                              Constants.tokenDecimals, 
                                              0));
    
        console.log("Stablecoin approve..")
        await contracts['StableCoin'].approve(OPEventAddress, 
                                              Utils.EncodeTokenAmount(Constants.numTokens * Constants.stableCoinOptionRatio, 
                                              Constants.tokenDecimals, 
                                              0));
        console.log("deploy..")
        await deployer.deploy(OPEvent, args[Constants.betPrice], 
                                       args[Constants.betSide], 
                                       args[Constants.eventPeriod], 
                                       args[Constants.numTokensToMint]);
    }
};