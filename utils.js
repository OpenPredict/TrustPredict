truffleConfig = require('./truffle-config')
ethers = require('ethers')

module.exports = {
    Constants: {
        'development' : {
            provider : new ethers.providers.JsonRpcProvider("http://" + truffleConfig.networks.development.host + ":" + truffleConfig.networks.development.port.toString()),
            //eventPeriod
            depositPeriodSeconds : 10,
            eventPeriodSeconds : 20,
            secret: truffleConfig.networks.development.secret
        },
        'kovan': {
            provider : new ethers.providers.JsonRpcProvider('https://kovan.infura.io/v3/fb44167f83e740898c90737b6ec456d8'),
            //eventPeriod
            eventPeriodSeconds : 100000,
            secret: truffleConfig.networks.kovan.secret,
            contractAddresses: {
                'OPUSD'      : '0xB876a52ABD933a02426C31d8231e9B9352864214',
                'ChainLink'  : '0xa36085F69e2889c224210F603D836748e7dC0088'
            }
        },
        pairings: {
            "AUD/USD"   : "0x5813A90f826e16dB392abd2aF7966313fc1fd5B8",
            "BAT/USD"   : "0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219",
            "BNB/USD"   : "0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16",
            "BTC/USD"   : "0x6135b13325bfC4B00278B4abC5e20bbce2D6580e",
            "CHF/USD"   : "0xed0616BeF04D374969f302a34AE4A63882490A8C",
            "DAI/USD"   : "0x777A68032a88E5A84678A77Af2CD65A7b3c0775a",
            "ETH/USD"   : "0x9326BFA02ADD2366b30bacB125260Af641031331",
            "EUR/USD"   : "0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13",
            "GBP/USD"   : "0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9",
            "JPY/USD"   : "0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942",
            "LINK/USD"  : "0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0",
            "LTC/USD"   : "0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640",
            "Oil/USD"   : "0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea",
            "SNX/USD"   : "0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD",
            "XAG/USD"   : "0x4594051c018Ac096222b5077C3351d523F93a963",
            "XAU/USD"   : "0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5",
            "XRP/USD"   : "0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3",
            "XTZ/USD"   : "0xC6F39246494F25BbCb0A8018796890037Cb5980C",
            "sDEFI/USD" : "0x70179FB2F3A0a5b7FfB36a235599De440B0922ea"
        },
        // Token selection
        IOTokenSelection : 0,
        OTokenSelection : 1,
        // args
        // -- keys --
        betPrice : 0,
        betSide : 1,
        eventPeriod : 2,
        numTokensToMint : 3,
        priceAggregator : 4,
        // -- values --
        rawBetPrice : "36015", // 360.15. Strings for BigNumber conversion
        priceFeedDecimals : 8, // the return value for the base price
        // betSide selection
        Lower : 0,
        Higher : 1,
        // numTokensToMint
        numTokens : 1,
        OPUSDOptionRatio : 100,
        initialMaxPrediction : 5,
        minTokenAmount : 10,
        maxPredictionFactor: 2,
        maxDecimals : 18,
        tokenDecimals : 18,
    },

    getNextContractAddress: function (address, nonce){
        const { toChecksumAddress } = require('ethereum-checksum-address')
        rlp = require('rlp')
        keccak = require('keccak')
        var input_arr = [ address, nonce ];
        var rlp_encoded = rlp.encode(input_arr);
        var contract_address_long = keccak('keccak256').update(rlp_encoded).digest('hex');
        var contract_address = '0x'.concat(contract_address_long.substring(24));
        return toChecksumAddress(contract_address);
    },

    getTransactionCount: async function (index) {
        signer = new ethers.Wallet.fromMnemonic(this.Constants['development'].secret, "m/44'/60'/0'/0/" + index)
        nonce = await signer.connect(this.Constants['development'].provider).getTransactionCount()
        return nonce
    }
};
