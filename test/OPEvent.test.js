const OPEventTest = artifacts.require('OPEventTest');
const OPOption = artifacts.require('OPOption');
const StableCoin = artifacts.require('StableCoin');
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
require('./../migrations/setup');
const Utils = require('./../migrations/utils');

async function sendStablecoinToAddress(stableCoin, accounts) {
    await stableCoin.transfer(accounts[1], Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0));
    await stableCoin.transfer(accounts[2], Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0));
    await stableCoin.transfer(accounts[3], Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0));
    await stableCoin.transfer(accounts[4], Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0));

    const balance1 = await stableCoin.balanceOf.call(accounts[1]);
    const balance2 = await stableCoin.balanceOf.call(accounts[1]);
    const balance3 = await stableCoin.balanceOf.call(accounts[1]);
    const balance4 = await stableCoin.balanceOf.call(accounts[1]);

    assert.equal(balance1.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0)).toString());
    assert.equal(balance2.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0)).toString());
    assert.equal(balance3.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0)).toString());
    assert.equal(balance4.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(4 * stableCoinOptionRatio, 18, 0)).toString());
}

async function deployContract(stableCoin, accounts) {
    // get deployer address nonce
    nonce = await web3.eth.getTransactionCount(accounts[1]);
    // get contract deployment address
    OPEventAddress = Utils.getNextContractAddress(accounts[1], nonce+1)
    // approve contract address for 100 StableCoin (ie. 1 O Token) from deployer address
    await stableCoin.approve(OPEventAddress, Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[1]})
    // assert approval happened successfully
    const contractAllowance = await stableCoin.allowance(accounts[1], OPEventAddress);
    assert.equal(contractAllowance.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0)).toString());
    //encode constructor arguments
    args[betPrice] = Utils.EncodeTokenAmount(ethBasePrice, priceFeedDecimals, 2);
    args[betSide] = Lower
    args[eventPeriod] = eventPeriodSeconds
    args[numTokensToMint] = Utils.EncodeTokenAmount(1, tokenDecimals, 0);
    // deploy contract
    OPEvent = await OPEventTest.new(args[betPrice], args[betSide], args[eventPeriod], args[numTokensToMint], stableCoin.address, {from: accounts[1]});
    OTokenAddress  = await OPEvent.getTokenAddress(OTokenSelection);
    IOTokenAddress = await OPEvent.getTokenAddress(IOTokenSelection);
    OToken  = await OPOption.at(OTokenAddress);
    IOToken = await OPOption.at(IOTokenAddress);
    return [OPEvent, OToken, IOToken];
}

// test case A:
// - valid contract deployment
// - 3 more valid mints: 2 on IO side, one on O side.
// - failed attempt to settle before minimum amount reached
// - 6 more mints, 3 either side. minimum amount reached
// - valid settlement on O side
// - 2 valid O claims, 2 invalid IO claims, with values for valid claims asserted
// - invalid claim from same address on O token side
// - invalid revokes from all addresses involved
// - invalid settlement call
// - invalid mint call
contract("Test Case A", async (accounts) => {
    let stableCoin;
    let OPEvent;
    let OToken;
    let IOToken;
    before( async () => {
        stableCoin = await StableCoin.new();
        await sendStablecoinToAddress(stableCoin, accounts);
        [OPEvent, OToken, IOToken] = await deployContract(stableCoin, accounts);
    })

    it("Should create 3 valid mints", async () => {
        // approve contract address for 100 SCT
        //****/
        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[2]})
        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[3]})
        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[4]})

        // assert approvals happened successfully
        const contractAllowance1 = await stableCoin.allowance(accounts[2], OPEvent.address);
        const contractAllowance2 = await stableCoin.allowance(accounts[3], OPEvent.address);
        const contractAllowance3 = await stableCoin.allowance(accounts[4], OPEvent.address);
        assert.equal(contractAllowance1.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0)).toString());
        assert.equal(contractAllowance2.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0)).toString());
        assert.equal(contractAllowance3.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1 * stableCoinOptionRatio, tokenDecimals, 0)).toString());

        // mints: 2 and 3 on IO side, 4 on O side.
        OPEvent.mint(Utils.EncodeTokenAmount(1, tokenDecimals, 0), IOTokenSelection, {from: accounts[2]})
        OPEvent.mint(Utils.EncodeTokenAmount(1, tokenDecimals, 0), IOTokenSelection, {from: accounts[3]})
        OPEvent.mint(Utils.EncodeTokenAmount(1, tokenDecimals, 0),  OTokenSelection, {from: accounts[4]})
        
        // assert correct mint balance for each contract
        balanceAccounts2 = await IOToken.balanceOf(accounts[2])
        balanceAccounts3 = await IOToken.balanceOf(accounts[3])
        balanceAccounts4 = await  OToken.balanceOf(accounts[4])
        assert.equal(balanceAccounts2.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1, tokenDecimals, 0)).toString());
        assert.equal(balanceAccounts3.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1, tokenDecimals, 0)).toString());
        assert.equal(balanceAccounts4.valueOf().toString(), web3.utils.toBN(Utils.EncodeTokenAmount(1, tokenDecimals, 0)).toString());

        // settlement price is higher
        settlementPrice = Utils.EncodeTokenAmount(ethBasePrice + 2, priceFeedDecimals, 2);

        // assert failure to settle where minimum amount not yet reached
        await truffleAssert.reverts(
            OPEvent.settle(settlementPrice),
            "OpenPredictEvent: minimum amount not yet reached."
        );

        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(2 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[2]})
        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(2 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[3]})
        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(2 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[4]})

        // mint enough to satisfy event params
        OPEvent.mint(Utils.EncodeTokenAmount(2, tokenDecimals, 0), IOTokenSelection, {from: accounts[2]})
        OPEvent.mint(Utils.EncodeTokenAmount(2, tokenDecimals, 0), IOTokenSelection, {from: accounts[3]})
        OPEvent.mint(Utils.EncodeTokenAmount(2, tokenDecimals, 0),  OTokenSelection, {from: accounts[4]})

        // assert failure to settle where event not yet concluded.
        await truffleAssert.reverts(
            OPEvent.settle(settlementPrice),
            "OpenPredictEvent: Event not yet concluded."
        );
        
        // verify mint fails following deposit period complete
        console.log("waiting for deposit period to pass..")
        await new Promise(r => setTimeout(r, depositPeriodSeconds * 1000));
        await stableCoin.approve(OPEvent.address, Utils.EncodeTokenAmount(2 * stableCoinOptionRatio, tokenDecimals, 0), {from: accounts[2]})
        await truffleAssert.reverts(
            OPEvent.mint(Utils.EncodeTokenAmount(2, tokenDecimals, 0), IOTokenSelection, {from: accounts[2]}),
            "OpenPredictEvent: Event started. Minting of new tokens is disabled."
        );
        
        // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        console.log("waiting for event settlement..")
        await new Promise(r => setTimeout(r, (eventPeriodSeconds - depositPeriodSeconds) * 1000));

        // settle event
        OPEvent.settle(settlementPrice);
        // validate price per winning token as 2/3 of a token for each IO holder
        amountPerWinningTokenContract = await OPEvent.getAmountPerWinningToken();
        amountPerWinningToken = web3.utils.toBN(
            Utils.EncodeTokenAmount("0666666666666666666", tokenDecimals, tokenDecimals)
        );
        assert.equal(amountPerWinningTokenContract.valueOf().toString(),
                     amountPerWinningToken.valueOf().toString());

        // IO tokens win. valid claims from O tokens..
        // first grant allowance to contract to burn tokens
        await IOToken.approve(OPEvent.address, Utils.EncodeTokenAmount(3, tokenDecimals, 0), {from: accounts[2]})
        await IOToken.approve(OPEvent.address, Utils.EncodeTokenAmount(3, tokenDecimals, 0), {from: accounts[3]})
        await OPEvent.claim({from: accounts[2]})
        await OPEvent.claim({from: accounts[3]})
        // verify balance for accounts is previous tokens + winning tokens
        balanceAccount2Contract = await stableCoin.balanceOf(accounts[2])
        balanceAccount3Contract = await stableCoin.balanceOf(accounts[3])
        console.log(balanceAccount2Contract.valueOf().toString());
        console.log(balanceAccount3Contract.valueOf().toString());
        // balanceAccount2 = Utils.EncodeTokenAmount((3 * stableCoinOptionRatio), tokenDecimals, tokenDecimals) + (3 * amountPerWinningToken);
        // balanceAccount3 = Utils.EncodeTokenAmount((3 * stableCoinOptionRatio), tokenDecimals, tokenDecimals) + (3 * amountPerWinningToken);
        // assert.equal(balanceAccount2Contract.valueOf().toString(), balanceAccount2.valueOf.toString());
        // assert.equal(balanceAccount3Contract.valueOf().toString(), balanceAccount3.valueOf.toString());
        
    })
})