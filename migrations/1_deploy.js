const OPEventFactory   = artifacts.require("OPEventFactory");
const ChainLink = artifacts.require("ChainLinkToken");
const OPUSD     = artifacts.require("OPUSDToken");
const Oracle     = artifacts.require("Oracle");
const Utils     = artifacts.require("Utils");
const utils  = require('../utils.js');
const ethers = require('ethers')

module.exports = async function (deployer, network, accounts) {
    console.log("network: " + network)
    process.env.NETWORK = network
    if(network != "development"){
        let Constants = utils.Constants
        console.log("Creating constructor argument list..")
        args = []
        args[Constants.betPrice] = ethers.utils.parseUnits(Constants.rawBetPrice.toString(), Constants.priceFeedDecimals - 2);
        args[Constants.betSide] = Constants.Higher
        args[Constants.eventPeriod] = Constants[network].eventPeriodSeconds
        args[Constants.numTokensToMint] = ethers.utils.parseUnits(Constants.numTokens.toString());
        args[Constants.priceAggregator] = Constants.pairings["ETH/USD"]
    
        console.log("Getting contract address and Oracle address for setup transactions..")
        nonce = await new ethers.Wallet(Constants[network].secret, Constants[network].provider).getTransactionCount();
        OPEventAddress = Utils.getNextContractAddress(accounts[0], nonce+2)
        OracleAddress  = Utils.getNextContractAddress(OPEventAddress, 1);
        
        contracts = []
        contracts['ChainLink'] = await ChainLink.at(Constants.contractAddresses.ChainLink);
        contracts['OPUSD'] = await OPUSD.at(Constants.contractAddresses.OPUSD);

        console.log("ChainLink approve..")
        await contracts['ChainLink'].approve(OracleAddress, 
                                             ethers.utils.parseUnits((Constants.numTokens).toString()));
    
        console.log("OPUSD approve..")
        await contracts['OPUSD'].approve(OPEventAddress, 
                                         ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()));

        console.log("deploy..")
        await deployer.deploy(OPEvent, args[Constants.betPrice], 
                                       args[Constants.betSide], 
                                       args[Constants.eventPeriod], 
                                       args[Constants.numTokensToMint],
                                       args[Constants.priceAggregator]);
    }
};