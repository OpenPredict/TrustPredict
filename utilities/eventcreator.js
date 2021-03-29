const ContractProxy     = require('./../build/contracts/ContractProxy.json');
const OPUSD             = require('./../build/contracts/OPUSDToken.json');
const ChainLink         = require('./../build/contracts/ChainLinkToken.json');
const Utils             = require('./../build/contracts/Utils.json');
const Oracle            = require('./../build/contracts/Oracle.json');
const TrustPredictToken = require('./../build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('./../build/contracts/OPEventFactory.json');
var ethers = require('ethers');
const utils = require('./../utils.js');
let Constants = utils.Constants;

//wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/0")
wallet = new ethers.Wallet(Constants['kovan'].secret, Constants['kovan'].provider)

console.log('wallet address: ' + wallet.address);

// Create ethers contracts
kovan = true;

contractAddresses = []
contracts = []

localTime = 250
args =[]
args[Constants.betPrice]        = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2);
args[Constants.betSide]         = Constants.Lower
args[Constants.eventPeriod]     = localTime
args[Constants.numTokensToMint] = ethers.utils.parseUnits('5');
args[Constants.priceAggregator] = Constants.pairings['BTC/USD']
settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).add(
                  ethers.utils.parseUnits("2", Constants.priceFeedDecimals))

// OPEventFactory initial data gathering
async function createEvent() {
    await setContractAddresses();
    contracts['OPEventFactory'].getNonce().then(async (nonce) => {
        console.log("nonce: " + nonce);
        console.log("wallet address: " + wallet.address);

        // contract address creation starts at nonce 1, so we emulate that for the Event ID.
        OPEventID = utils.getNextContractAddress(contracts['OPEventFactory'].address, Number(nonce))
        //OPEventID = '0xE9d364DB61952e3d1945e703990E7365A494FE7a'

        console.log("ChainLink approve..")
        await contracts['ChainLink'].approve(contracts['Oracle'].address,
                                 ethers.utils.parseUnits((Constants.numTokens).toString()))

        await new Promise(r => setTimeout(r, 5 * 1000));

        // approve OPEventFactory address for 100 OPUSD (ie. 1 Yes Token) from deployer address
         console.log("OPUSD approve..")
        await contracts['USDC'].approve(contracts['OPEventFactory'].address,
                            ethers.utils.parseUnits(((Constants.numTokens * 10) * Constants.USDCOptionRatio).toString()))

        await new Promise(r => setTimeout(r, 5 * 1000));

        // deploy event
        console.log("deploying event..")
        const result = await contracts['OPEventFactory'].createOPEvent(args[Constants.betPrice],
                                                        args[Constants.betSide],
                                                        args[Constants.eventPeriod],
                                                        args[Constants.numTokensToMint],
                                                        args[Constants.priceAggregator],
                                                        {gasLimit: 1000000});
        console.log('result: ' + JSON.stringify(result));

        YesToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.YesTokenSelection)
        NoToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.NoTokenSelection)
        console.log('OPEventID: ' + OPEventID);
        console.log('YesToken: ' + YesToken);
        console.log('NoToken: ' + NoToken);

        eventData = await contracts['OPEventFactory'].events(OPEventID)
        console.log('EventData: ' + eventData);
    });
};

async function settle() {
    await setContractAddresses();
    console.log('waiting for event completion..')
    //await new Promise(r => setTimeout(r, localTime * 1000));
    console.log('settlementPrice: ' + settlementPrice)
    await contracts['OPEventFactory'].settle(OPEventID, settlementPrice, {from: wallet.address});
}


async function stake() {
    const OPEventID = '0xc011AeF248A96270a3a1Bb500746E930965b408D';
    const selection = 0;

    // approve OPEventFactory address for 1000 OPUSD (ie. 10 No Token) from deployer address
    // console.log("OPUSD approve..")
    // await contracts['USDC'].approve(contracts['OPEventFactory'].address,
    //                     ethers.utils.parseUnits(((Constants.numTokens * 10) * Constants.USDCOptionRatio).toString()))
    // await new Promise(r => setTimeout(r, 5 * 1000));
    console.log("Stake..")
    const result = await contracts['OPEventFactory'].stake(OPEventID, args[Constants.numTokensToMint], selection, {from: wallet.address});
    console.log('result: ' + JSON.stringify(result));
}

async function eventData() {
    await setContractAddresses();
    const OPEventID = '0xc011AeF248A96270a3a1Bb500746E930965b408D';
    YesToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.YesTokenSelection)
    await new Promise(r => setTimeout(r, 5 * 1000));
    NoToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.NoTokenSelection)  
    console.log('OPEventID: ' + OPEventID);
    console.log('YesToken: ' + YesToken);
    console.log('NoToken: ' + NoToken);

    await new Promise(r => setTimeout(r, 5 * 1000));
    eventData = await contracts['OPEventFactory'].events(OPEventID)
    console.log('EventData: ' + eventData);
}

async function setContractAddresses() {
    nonce = 0;
    if(kovan){
        contractAddresses['ContractProxy'] = '0x328eC87d3AE746169DF56089ED96DEa8e34453B1';
        contracts['ContractProxy']          = new ethers.Contract(contractAddresses['ContractProxy'], ContractProxy.abi, wallet);
        contractAddresses['USDC']          = await contracts['ContractProxy'].getOPUSDAddress();
        contractAddresses['ChainLink']      = await contracts['ContractProxy'].getChainLinkAddress();
        contractAddresses['Utils']          = await contracts['ContractProxy'].getUtilsAddress();
        contractAddresses['Oracle']         = await contracts['ContractProxy'].getOracleAddress();
        contractAddresses['TrustPredict']   = await contracts['ContractProxy'].getTrustPredictAddress();
        contractAddresses['OPEventFactory'] = await contracts['ContractProxy'].getOPEventFactoryAddress();
    }else {
        contractAddresses['ContractProxy']  = utils.getNextContractAddress(wallet.address, nonce++);
        contractAddresses['USDC']          = utils.getNextContractAddress(wallet.address, nonce++);
        contractAddresses['ChainLink']      = utils.getNextContractAddress(wallet.address, nonce++);
        contractAddresses['Utils']          = utils.getNextContractAddress(wallet.address, nonce++);
        contractAddresses['Oracle']         = utils.getNextContractAddress(wallet.address, nonce++);
        contractAddresses['TrustPredict']   = utils.getNextContractAddress(wallet.address, nonce++);
        contractAddresses['OPEventFactory'] = utils.getNextContractAddress(wallet.address, nonce++);
    }

    Object.keys(contractAddresses).forEach((key) => {
        console.log(key + " address: " + contractAddresses[key])
    })

    contracts['USDC']          = new ethers.Contract(contractAddresses['USDC'],          OPUSD.abi,             wallet);
    contracts['ChainLink']      = new ethers.Contract(contractAddresses['ChainLink'],      ChainLink.abi,         wallet);
    contracts['Utils']          = new ethers.Contract(contractAddresses['Utils'],          OPUSD.abi,             wallet);
    contracts['Oracle']         = new ethers.Contract(contractAddresses['Oracle'],         OPEventFactory.abi,    wallet);
    contracts['TrustPredict']   = new ethers.Contract(contractAddresses['TrustPredict'],   TrustPredictToken.abi, wallet);
    contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi,    wallet);
}

async function getNonce() {
    nonce = await wallet.getTransactionCount();
}

createEvent();
//stake();
//eventData();
