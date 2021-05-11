const ERC20             = artifacts.require("ERC20Mock");
const Utils             = artifacts.require("Utils");
const Oracle            = artifacts.require("Oracle");
const TrustPredictToken = artifacts.require('TrustPredictToken');
const OPEventFactory    = artifacts.require("OPEventFactory");
const ethers = require('ethers')
const utils = require('../utils.js');
let Constants = utils.Constants

module.exports = async function (deployer, network, accounts) {
    console.log("network: " + network)
    process.env.NETWORK = network
    contracts= []
    if(network == "development") {
        console.log('deploying USDC asset..');
        contracts['Asset'] = await ERC20.new("USD Coin", "USDC", ethers.utils.parseUnits('100000'));

        console.log('deploying Utils..');
        contracts['Utils'] = await Utils.new();

        console.log('deploying Oracle..');
        contracts['Oracle'] = await Oracle.new();

        console.log('deploying TrustPredict..');
        contracts['TrustPredict'] = await TrustPredictToken.new();

        console.log('linking Utils..');
        await OPEventFactory.link("Utils", contracts['Utils'].address);

        console.log('deploying OPEventFactory..');
        contracts['OPEventFactory'] = await OPEventFactory.new(
            contracts['Oracle'].address,
            contracts['TrustPredict'].address,
            contracts['Asset'].address,
            315360000,
            ethers.utils.parseUnits('10'),
            2,
            Constants[network].depositPeriodSeconds,
            ethers.utils.parseUnits('100'),
            Constants[network].voidPeriodSeconds,
        );
        
        console.log('setting factory in TrustPredict token..');
        await contracts['TrustPredict'].setFactory(contracts['OPEventFactory'].address, true);
        
        console.log('setting price aggregators..');
        await contracts['Oracle'].setPriceAggregators(
            [
                '0x5813A90f826e16dB392abd2aF7966313fc1fd5B8',
                '0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219',
                '0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16',
                '0x6135b13325bfC4B00278B4abC5e20bbce2D6580e',
                '0xed0616BeF04D374969f302a34AE4A63882490A8C',
                '0x777A68032a88E5A84678A77Af2CD65A7b3c0775a',
                '0x9326BFA02ADD2366b30bacB125260Af641031331',
                '0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13',
                '0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9',
                '0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942',
                '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0',
                '0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640',
                '0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea',
                '0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD',
                '0x4594051c018Ac096222b5077C3351d523F93a963',
                '0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5',
                '0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3',
                '0xC6F39246494F25BbCb0A8018796890037Cb5980C',
                '0x70179FB2F3A0a5b7FfB36a235599De440B0922ea'
            ],
            [
                'AUD/USD',
                'BAT/USD',
                'BNB/USD',
                'BTC/USD',
                'CHF/USD',
                'DAI/USD',
                'ETH/USD',
                'EUR/USD',
                'GBP/USD',
                'JPY/USD',
                'LINK/USD',
                'LTC/USD',
                'Oil/USD',
                'SNX/USD',
                'XAG/USD',
                'XAU/USD',
                'XRP/USD',
                'XTZ/USD',
                'sDEFI/USD',
            ]
        )

        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })
    }
    
    if(network == "kovan") {
        console.log('deploying USDC asset..');
        contracts['Asset'] = await ERC20.new("USD Coin", "USDC", ethers.utils.parseUnits('100000'));

        console.log('deploying Utils..');
        contracts['Utils'] = await Utils.new();

        console.log('deploying Oracle..');
        contracts['Oracle'] = await Oracle.new();

        console.log('deploying TrustPredict..');
        contracts['TrustPredict'] = await TrustPredictToken.new();

        console.log('linking Utils..');
        await OPEventFactory.link("Utils", contracts['Utils'].address);

        console.log('deploying OPEventFactory..');
        contracts['OPEventFactory'] = await OPEventFactory.new(
            contracts['Oracle'].address,
            contracts['TrustPredict'].address,
            contracts['Asset'].address,
            315360000,
            ethers.utils.parseUnits('10'),
            2,
            86400,
            ethers.utils.parseUnits('100'),
        );
        
        console.log('setting factory in trsutpredict token..');
        await contracts['TrustPredict'].setFactory(contracts['OPEventFactory'].address, true);
        
        console.log('setting price aggregators..');
        await contracts['Oracle'].setPriceAggregators(
            [
                '0x5813A90f826e16dB392abd2aF7966313fc1fd5B8',
                '0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219',
                '0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16',
                '0x6135b13325bfC4B00278B4abC5e20bbce2D6580e',
                '0xed0616BeF04D374969f302a34AE4A63882490A8C',
                '0x777A68032a88E5A84678A77Af2CD65A7b3c0775a',
                '0x9326BFA02ADD2366b30bacB125260Af641031331',
                '0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13',
                '0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9',
                '0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942',
                '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0',
                '0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640',
                '0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea',
                '0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD',
                '0x4594051c018Ac096222b5077C3351d523F93a963',
                '0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5',
                '0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3',
                '0xC6F39246494F25BbCb0A8018796890037Cb5980C',
                '0x70179FB2F3A0a5b7FfB36a235599De440B0922ea'
            ],
            [
                'AUD/USD',
                'BAT/USD',
                'BNB/USD',
                'BTC/USD',
                'CHF/USD',
                'DAI/USD',
                'ETH/USD',
                'EUR/USD',
                'GBP/USD',
                'JPY/USD',
                'LINK/USD',
                'LTC/USD',
                'Oil/USD',
                'SNX/USD',
                'XAG/USD',
                'XAU/USD',
                'XRP/USD',
                'XTZ/USD',
                'sDEFI/USD',
            ]
        )

        Object.keys(contracts).forEach((key) => {
            console.log(key + " address: " + contracts[key].address)
        })
    }
};