module.exports = {
    getNextContractAddress: function (address, nonce){
        var input_arr = [ address, nonce ];
        var rlp_encoded = rlp.encode(input_arr);
        var contract_address_long = keccak('keccak256').update(rlp_encoded).digest('hex');
        var contract_address = '0x'.concat(contract_address_long.substring(24));
        return contract_address;
    },

    getFundingAddresses: function (sendingAddress) {
        web3.eth.getTransactionCount(sendingAddress).then(nonce => { 
            // LINK funding will have "nonce" nonce
            // StableCoin funding will have nonce+1 nonce
            OPEventAddress = this.getNextContractAddress(sendingAddress, nonce+2)
            // contract deployments have nonces starting at 1
            // OPOptionOAddress is at nonce 1 for OPEventAddress
            // OPOptionOAddress is at nonce 2 for OPEventAddress
            OracleAddress     = this.getNextContractAddress(OPEventAddress, 3);
        });
    },

    EncodeTokenAmount: function (tokenAmount, decimalRepresentation, decimalsInArgument) {
        if(decimalRepresentation > maxDecimals || decimalsInArgument > maxDecimals){
            throw new Error('decimal encoding incorrect');
        }
        tokenAmountBN = web3.utils.toBN(tokenAmount);
        DecimalsBN = web3.utils.toBN(decimalRepresentation - decimalsInArgument);
        tokenAmountEncoded = web3.utils.toHex(tokenAmountBN.mul(web3.utils.toBN(10).pow(DecimalsBN)));
        return tokenAmountEncoded;
    }
};
