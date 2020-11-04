
var ethers = require('ethers');
const { getTransactionCount } = require('./utils.js');
const utils = require('./utils.js');
let Constants = utils.Constants;
network = 'development';

async function GetTransactionCount() {
    if(network == 'kovan'){
        wallet = new ethers.Wallet(Constants['kovan'].secret, Constants['kovan'].provider)
        nonce = await wallet.getTransactionCount() 
    }else{
        wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/0")
        nonce = await wallet.connect(Constants['development'].provider).getTransactionCount()
    }
    console.log('wallet address: ' + wallet.address);
    console.log('nonce: ' + nonce);
    console.log('Utils:          ' + utils.getNextContractAddress(wallet.address, nonce++));
    console.log('Oracle:         ' + utils.getNextContractAddress(wallet.address, nonce++));
    console.log('TrustPredict:   ' + utils.getNextContractAddress(wallet.address, nonce++));
    console.log('OPEventFactory: ' + utils.getNextContractAddress(wallet.address, nonce++));
}
GetTransactionCount();
