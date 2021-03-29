
var ethers = require('ethers');
const utils = require('./../utils.js')
let Constants = utils.Constants;
const OPEventFactory = require('./../build/contracts/OPEventFactory.json');

eventId = '0xa5f7b1d7be8945135764647c9fedfde7fff1cebe'
price = 100000000

async function settle() {
    contracts = []
    contractAddresses = []
    wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/0")
    wallet = wallet.connect(Constants['development'].provider)
    contractAddresses = setContractAddresses(wallet);
    contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi,    wallet);
    console.log('settling event..')
    result = await contracts['OPEventFactory'].settle(eventId, price, {gasLimit: 1000000});
    console.log(result);
}

function setContractAddresses(wallet) {
    nonce = 0;
    contractAddresses = []
    contractAddresses['ContractProxy']  = utils.getNextContractAddress(wallet.address, nonce++)
    contractAddresses['USDC']          = utils.getNextContractAddress(wallet.address, nonce++)
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
