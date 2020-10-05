const OPUSDToken        = artifacts.require("OPUSDToken");
const ChainLinkToken    = artifacts.require("ChainLinkToken");
const Utils             = artifacts.require("Utils");
const Oracle            = artifacts.require("Oracle");
const TrustPredictToken = artifacts.require('TrustPredictToken');
const OPEventFactory    = artifacts.require("OPEventFactory");

const ethers = require('ethers')

module.exports = async function (deployer, network, accounts) {
    console.log("network: " + network)
    process.env.NETWORK = network
    contracts= []
    // Need to deploy OPUSD and ChainLink on local networks
    if(network == "development") {
        contracts['OPUSD'] = await OPUSDToken.new();
        contracts['ChainLink'] = await ChainLinkToken.new();
    }
    
    contracts['Utils'] = await Utils.new();
    // Link Utils to Oracle and OPEventFactory
    await Oracle.link("Utils", contracts['Utils'].address);
    contracts['Oracle'] = await Oracle.new();
    await TrustPredictToken.link("Utils", contracts['Utils'].address);
    contracts['TrustPredict'] = await TrustPredictToken.new("");
    await OPEventFactory.link("Utils", contracts['Utils'].address);
    contracts['OPEventFactory'] = await OPEventFactory.new();
    Object.keys(contracts).forEach((key) => {
        console.log(key + " address: " + contracts[key].address)
    })

    // mint OPUSD to account 0 following contract deployments on dev network
    if(network=='development'){
        await contracts['OPUSD'].mint(accounts[0], 
            ethers.utils.parseUnits('100000'));
    }
};