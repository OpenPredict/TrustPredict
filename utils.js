truffleConfig = require('./truffle-config')
Web3 = require('web3')

module.exports = {
    Constants: {
        'development' : {
            web3 : new Web3("http://" + truffleConfig.networks.development.host + ":" + truffleConfig.networks.development.port.toString()),
            //eventPeriod
            depositPeriodSeconds : 10,
            eventPeriodSeconds : 15,
        },
        'kovan': {
            web3 : new Web3(truffleConfig.networks.kovan.provider),
            //eventPeriod
            eventPeriodSeconds : 100000,
        },
        // contract addresses for existing ERC20s
        contractAddresses : {
            'StableCoin' : '0xb5f4d40279Aaa89F7F556558C789D1816C3D5122',
            'ChainLink'  : '0xa36085F69e2889c224210F603D836748e7dC0088'
        },
        // Token selection
        OTokenSelection : 0,
        IOTokenSelection : 1,
        // args
        // -- keys --
        betPrice : 0,
        betSide : 1,
        eventPeriod : 2,
        numTokensToMint : 3,
        // -- values --
        ethBasePrice : "36015", // 360.15. Strings for BigNumber conversion
        priceFeedDecimals : 8, // the return value for the base price
        // betSide selection
        Higher : 0,
        Lower : 1,
        // numTokensToMint
        numTokens : 1,
        stableCoinOptionRatio : 100,
        maxDecimals : 18,
        tokenDecimals : 18,
    },

    getNextContractAddress: function (address, nonce){
        rlp = require('rlp')
        keccak = require('keccak')
        var input_arr = [ address, nonce ];
        var rlp_encoded = rlp.encode(input_arr);
        var contract_address_long = keccak('keccak256').update(rlp_encoded).digest('hex');
        var contract_address = '0x'.concat(contract_address_long.substring(24));
        return contract_address;
    },

    EncodeTokenAmount: function (tokenAmount, decimalRepresentation, decimalsInArgument) {
        let web3 = this.Constants.development.web3
        if(decimalRepresentation > this.Constants.maxDecimals || decimalsInArgument > this.Constants.maxDecimals){
            throw new Error('decimal encoding incorrect');
        }
        tokenAmountBN = web3.utils.toBN(tokenAmount);
        DecimalsBN = web3.utils.toBN(decimalRepresentation - decimalsInArgument);
        tokenAmountEncoded = web3.utils.toHex(tokenAmountBN.mul(web3.utils.toBN(10).pow(DecimalsBN)));
        return tokenAmountEncoded;
    }
};
