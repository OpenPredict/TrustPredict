
var ethers = require('ethers');
const utils = require('./../utils.js')
let Constants = utils.Constants;
const OPEventFactory = require('./../build/contracts/OPEventFactory.json');
const OPUSD = require('./../build/contracts/OPUSDToken.json');

address = '0' // index of the wallet to stake from
eventId = '0xf737b8a513f2b42d816f504fbd64bb74f3375d0b'

async function settle() {
    contracts = []
    contractAddresses = []
    contractcreator = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/0")
    contractAddresses = setContractAddresses(contractcreator);

    wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/" + address)
    wallet = wallet.connect(Constants['development'].provider)
    
    contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, wallet);
    contracts['OPUSD']   = new ethers.Contract(contractAddresses['OPUSD'],     OPUSD.abi, wallet);

    console.log('Setting approval to contract..')
    await contracts['OPUSD'].approve(contracts['OPEventFactory'].address, ethers.utils.parseUnits('200'));

    console.log('staking event..')
    result = await contracts['OPEventFactory'].stake(eventId, 
                                                     ethers.utils.parseUnits('2'),
                                                     Constants.OTokenSelection,
                                                     {gasLimit: 1000000});
    console.log(result);
}

function setContractAddresses(wallet) {
    nonce = 0;
    contractAddresses = []
    contractAddresses['ContractProxy']  = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['OPUSD']          = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['ChainLink']      = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['Utils']          = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['Oracle']         = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['TrustPredict']   = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['OPEventFactory'] = utils.getNextContractAddress(wallet.address, nonce++)
    Object.keys(contractAddresses).forEach((key) => {
        console.log(key + " address: " + contractAddresses[key])
    })
    return contractAddresses;
}

settle();
