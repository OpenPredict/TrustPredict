
var ethers = require('ethers');
const utils = require('./../utils.js')
let Constants = utils.Constants;
const OPEventFactory = require('./../build/contracts/OPEventFactory.json');
const TrustPredict = require('./../build/contracts/TrustPredictToken.json');

eventId = '0x6c80403914dcf83a9fe755823ec1a388edc65e77'
address = '2'

async function settle() {
    contracts = []
    contractAddresses = []
    contractcreator = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/0")
    contractAddresses = setContractAddresses(contractcreator);

    wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/" + address)
    wallet = wallet.connect(Constants['development'].provider)
    
    contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, wallet);
    contracts['TrustPredict']   = new ethers.Contract(contractAddresses['TrustPredict'],     TrustPredict.abi, wallet);

    console.log('Setting approval to contract..')
    await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true);
    console.log('claiming event..')
    result = await contracts['OPEventFactory'].claim(eventId, {gasLimit: 1000000});
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
