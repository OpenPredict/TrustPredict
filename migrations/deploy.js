//gas_estimate = function_call.estimateGas({ from: address }).then(result => {gas = result})

module.exports = {
    DeployOPEvent: async function (args) {
        console.log("test")
        from = web3.eth.accounts[0].address
        nonce = await web3.eth.getTransactionCount(from);
            console.log('nonce start ' + nonce);
            gasPrice = await web3.eth.getGasPrice();
            
                OPEventAddress = utils.getNextContractAddress(from, nonce+2)
                console.log('OPEventAddress ' + OPEventAddress)
                OracleAddress  = utils.getNextContractAddress(OPEventAddress, 3);
                console.log('OracleAddress ' + OracleAddress)
                methods[ChainLink]  = contracts[ChainLink].methods.transfer(OracleAddress, utils.EncodeTokenAmount(1, tokenDecimals, 0))
                methods[StableCoin] = contracts[StableCoin].methods.approve(OPEventAddress, utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0))
                console.log("test here")
                
                await this.sendTransaction(ChainLink, web3.eth.accounts[0], contract_addresses[ChainLink], nonce);
                await this.sendTransaction(StableCoin, web3.eth.accounts[0], contract_addresses[StableCoin], nonce+1);
                console.log('sleeping..');
                console.log('done');
                await this.deployContract(OPEvent, args, nonce+2);
                console.log('executed deploycontract');
    },

    deployContract: async function(contractName, args, nonce) {

        contractObject = {}
        contractObject.data = contract_data[contractName].bytecode
        contractObject.arguments = args
        methods[contractName] = contracts[contractName].deploy(contractObject);
        await this.sendTransaction(contractName, web3.eth.accounts[0], -1, nonce);
        return true;

     },

    sendTransaction: async function(ID, account, to, nonce, gasPrice) {
        console.log("in sendTransaction") 
        console.log('nonce: ' + nonce);
        //console.log('data: ' + methods[ID].encodeABI());
        console.log('gasPrice: ' + gasPrice);
        // sign and send transaction
        gas = 10000000;
        console.log('gas: ' + gas) 
           //encode transaction data
            txObject = {
               nonce:    web3.utils.toHex(nonce),
               gasPrice: web3.utils.toHex(gasPrice),
               gasLimit: web3.utils.toHex(gas + 100000),
               data:     methods[ID].encodeABI(),
            }
            if(to != -1){
                txObject.to = to;
            }
            console.log('txObject: ' + txObject) 
            transaction = await account.signTransaction(txObject);
                console.log("signed")
                receipt = web3.eth.sendSignedTransaction(transaction.rawTransaction)
                    console.log("sent")
                    transactions[ID] = transaction
                    receipts[ID] = receipt
                    return true;
    }
};

args[betPrice] = utils.EncodeTokenAmount(ethBasePrice, priceFeedDecimals, 2);
args[betSide] = 1
args[eventPeriod] = 1500
args[numTokensToMint] = utils.EncodeTokenAmount(1, tokenDecimals, 0);

