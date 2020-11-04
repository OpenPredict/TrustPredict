
var ethers = require('ethers');
const utils = require('./utils.js');
let Constants = utils.Constants;
network = 'development';
const ContractProxy = require('./build/contracts/ContractProxy.json');
contracts = []

async function GetAddresses() {
    if(network == 'kovan'){
        wallet = new ethers.Wallet(Constants['kovan'].secret, Constants['kovan'].provider)
    }else{
        wallet = new ethers.Wallet.fromMnemonic(Constants['development'].secret, "m/44'/60'/0'/0/0")
        wallet = await wallet.connect(Constants['development'].provider)
    }

    contracts['ContractProxy'] = new ethers.Contract('0xBf610614CaA08d9fe7a4F61082cc32951e547a91', ContractProxy.abi, wallet);
    OPUSDAddress = await contracts['ContractProxy'].getOPUSDAddress();
    console.log('OPUSDAddress: ' + OPUSDAddress);
}
GetAddresses();
