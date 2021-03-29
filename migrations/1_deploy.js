const ERC20             = artifacts.require("ERC20Mock");
const Utils             = artifacts.require("Utils");
const Oracle            = artifacts.require("Oracle");
const TrustPredictToken = artifacts.require('TrustPredictToken');
const OPEventFactory    = artifacts.require("OPEventFactory");

const ethers = require('ethers')

module.exports = async function (deployer, network, accounts) {
    console.log("network: " + network)
    process.env.NETWORK = network
    contracts= []
    if(network == "development") {
        contracts['USDC'] = await ERC20.new("USD Coin", "USDC", ethers.utils.parseUnits('100000'));
        contracts['Utils'] = await Utils.new();
        contracts['Oracle'] = await Oracle.new();
        contracts['TrustPredict'] = await TrustPredictToken.new();
        
        await OPEventFactory.link("Utils", contracts['Utils'].address);
        contracts['OPEventFactory'] = await OPEventFactory.new(
            contracts['Oracle'].address,
            contracts['TrustPredict'].address,
            contracts['USDC'].address
        );

        await contracts['TrustPredict'].setFactory(contracts['OPEventFactory'].address, true);

        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })
    }
};