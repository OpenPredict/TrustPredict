const ContractProxy     = require('./../build/contracts/ContractProxy.json');
const OPUSD             = require('./../build/contracts/OPUSDToken.json');
const ChainLink         = require('./../build/contracts/ChainLinkToken.json');
const Utils             = require('./../build/contracts/Utils.json');
const Oracle            = require('./../build/contracts/Oracle.json');
const TrustPredictToken = require('./../build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('./../build/contracts/OPEventFactory.json');
var ethers = require('ethers');
const utils = require('./../utils.js');

wallet = new ethers.Wallet.fromMnemonic(utils.Constants['development'].secret, "m/44'/60'/0'/0/0")
wallet = wallet.connect(utils.Constants['development'].provider)

// Create ethers contracts   
contracts = []   
let accountIndex = 0   
contracts['ContractProxy']  = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), ContractProxy.abi,     wallet);
contracts['OPUSD']          = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), OPUSD.abi,             wallet);
contracts['ChainLink']      = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), ChainLink.abi,         wallet);
contracts['Utils']          = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), OPUSD.abi,             wallet);
contracts['Oracle']         = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), OPEventFactory.abi,    wallet);
contracts['TrustPredict']   = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), TrustPredictToken.abi, wallet);
contracts['OPEventFactory'] = new ethers.Contract(utils.getNextContractAddress(wallet.address, accountIndex++), OPEventFactory.abi,    wallet);

// use eventId to query for data. subscriber will give us the data anyway.
// contracts['OPEventFactory'].getNonce().then(async (lastNonce) => {
//     console.log('lastNonce: ' + lastNonce);
//     const nonceRange = [...Array(parseInt(lastNonce)).keys()];
//     console.log('nonceRange: ' + nonceRange);
//     await Promise
//     .all(nonceRange
//     .filter(nonce => nonce > 0)
//     .map(async (nonce) => {
//       const eventID = this.crypto.getNextContractAddress(contracts['OPEventFactory'].address, nonce);
//       console.log('\nEvent ID: ' + eventID);
//       const eventData = await contracts['OPEventFactory'].getEventData(eventID);
//       console.log('\nEvent Data: ' + eventData);
//       const balances = await contracts['TrustPredict'].getTokenBalances(eventID);
//       console.log('\nbalances: ' + balances);
//       await this.parseEventData(eventID, eventData, balances);
//     }));
//   });

// OPEventFactory subscriber
utils.Constants['development'].provider.resetEventsBlock(1);
utils.Constants['development'].provider.on({
    address: contracts['OPEventFactory'].address,
    topics: [ethers.utils.id("EventUpdate(address)")], // OPEventFactory
}, (result) => {
    eventID = '0x' + result.data.substring(26)
    console.log("\nEvent ID: " + eventID)
    contracts['OPEventFactory'].getEventData(eventID).then(result => {
        console.log(" ")
        Object.keys(result).splice(result.length, result.length * 2).forEach((key) => {
            console.log(key + ": " + result[key]);
        })
    })
    contracts['TrustPredict'].getTokenBalance(eventID,0).then(result => {console.log(result)})
    contracts['TrustPredict'].getTokenBalance(eventID,1).then(result => {console.log(result)})
});