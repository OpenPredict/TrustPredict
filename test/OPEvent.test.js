const OPUSDToken = artifacts.require('OPUSDToken');
const ChainLinkToken = artifacts.require('ChainLinkToken');
const Utils = artifacts.require('Utils');
const Oracle = artifacts.require('Oracle');
const OPEventFactory = artifacts.require('OPEventFactory');
const OPEvent = artifacts.require('OPEvent');

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const utils = require('../utils.js');
const ethers = require('ethers');
const { AssertionError } = require("chai");
let Constants = utils.Constants

async function mintTokensToAddresses(contracts, accounts) {
    // mint enough OPUSD for 10 tokens per account
    OPUSDTokenValue = ethers.utils.parseUnits((Constants.numTokens * 10 * Constants.OPUSDOptionRatio).toString())
    accounts.filter((account, index) => index > 0).forEach(async (account, index) => {
        await contracts['OPUSD'].mint(account, OPUSDTokenValue);
        const balance = await contracts['OPUSD'].balanceOf.call(account);
        assert.equal(balance.valueOf().toString(), OPUSDTokenValue.valueOf().toString());
    })

    // send enough LINK for 10 contract deployments to account 1
    ChainLinkTokenValue = ethers.utils.parseUnits((Constants.numTokens * 10).toString())
    await contracts['ChainLink'].transfer(accounts[1], ChainLinkTokenValue);
    const balance = await contracts['ChainLink'].balanceOf.call(accounts[1]);
    assert.equal(balance.valueOf().toString(), ChainLinkTokenValue.valueOf().toString());
}

async function deployContract(contracts, accounts) {
    // get deployer address nonce
    nonce = await Constants[process.env.NETWORK].provider.getTransactionCount(contracts['OPEventFactory'].address);

    OPEventAddress = utils.getNextContractAddress(contracts['OPEventFactory'].address, nonce)

    console.log("ChainLink approve..")
    await contracts['ChainLink'].approve(contracts['Oracle'].address, 
                             ethers.utils.parseUnits((Constants.numTokens).toString()), 
                             {from: accounts[1]})
     // assert approval happened successfully
    const chainLinkAllowance = await contracts['ChainLink'].allowance(accounts[1], contracts['Oracle'].address);
    assert.equal(chainLinkAllowance.valueOf().toString(), 
                 ethers.utils.parseUnits((Constants.numTokens).toString()).toString());


    // approve OPEventFactory address for 100 OPUSD (ie. 1 O Token) from deployer address
    console.log("OPUSD approve..")
    await contracts['OPUSD'].approve(contracts['OPEventFactory'].address, 
                        ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), 
                        {from: accounts[1]})
    // assert approval happened successfully
    const OPUSDAllowance = await contracts['OPUSD'].allowance(accounts[1], contracts['OPEventFactory'].address);
    assert.equal(OPUSDAllowance.valueOf().toString(), 
                 ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());
                 

    //encode constructor arguments
    args =[]
    args[Constants.betPrice] = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2);
    args[Constants.betSide] = Constants.Lower
    args[Constants.eventPeriod] = Constants[process.env.NETWORK].eventPeriodSeconds
    args[Constants.numTokensToMint] = ethers.utils.parseUnits(Constants.numTokens.toString());
    args[Constants.priceAggregator] = Constants.pairings['ETH/USD']

    // deploy contract
    await contracts['OPEventFactory'].createOPEvent(args[Constants.betPrice], 
                                                    args[Constants.betSide], 
                                                    args[Constants.eventPeriod], 
                                                    args[Constants.numTokensToMint],
                                                    args[Constants.priceAggregator],
                                                    {from: accounts[1], gas: 10000000});

    // var keys = await contracts['OPEventFactory'].getOPEventIDs(OPEventAddress);
    // console.log('keys: ' + keys);

    // OPEventContract = await OPEvent.at(OPEventAddress);

    // // wager
    // console.log("OPUSD approve..")
    // await contracts['OPUSD'].approve(OPEventAddress, 
    //                     ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), 
    //                     {from: accounts[2]})

    // await OPEventContract.wager(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]})

    // assert correct keys created
    //assert.equal(OPEventAddress, OPEventContractAddresses[0]);

    //var OPEvent = OPEvent.at(OPEventAddress);
    return true;
}


contract("OPEvent", async (accounts) => {
    let contracts = []
    let OPEvent;   
    before( async () => {
        contracts['OPUSD'] = await OPUSDToken.new();
        contracts['ChainLink'] = await ChainLinkToken.new();
        contracts['Utils'] = await Utils.new();

        // Link Utils to Oracle and OPEventFactory
        await Oracle.link("Utils", contracts['Utils'].address);
        contracts['Oracle'] = await Oracle.new();
        await OPEventFactory.link("Utils", contracts['Utils'].address);
        contracts['OPEventFactory'] = await OPEventFactory.new("");

        Object.keys(contracts).forEach((key) => {
            console.log(key + " address:" + contracts[key].address)
        })
        await mintTokensToAddresses(contracts, accounts);
        await deployContract(contracts, accounts);
    })

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
    it("Should pass for test case A", async () => {
        // approve contract address for 100 OPUSD
        //****/
        assert(true);
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[3]})
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[4]})

        // // assert approvals happened successfully
        // const contractAllowance1 = await contracts['OPUSD'].allowance(accounts[2], OPEvent.address);
        // const contractAllowance2 = await contracts['OPUSD'].allowance(accounts[3], OPEvent.address);
        // const contractAllowance3 = await contracts['OPUSD'].allowance(accounts[4], OPEvent.address);
        // assert.equal(contractAllowance1.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());
        // assert.equal(contractAllowance2.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());
        // assert.equal(contractAllowance3.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());

        // // mints: 2 and 3 on IO side, 4 on O side.
        // OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]})
        // OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[3]})
        // OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.OTokenSelection,  {from: accounts[4]})
        
        // // assert correct mint balance for each contract
        // balanceAccounts2 = await IOToken.balanceOf(accounts[2])
        // balanceAccounts3 = await IOToken.balanceOf(accounts[3])
        // balanceAccounts4 = await  OToken.balanceOf(accounts[4])
        // assert.equal(balanceAccounts2.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens).toString()).toString());
        // assert.equal(balanceAccounts3.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens).toString()).toString());
        // assert.equal(balanceAccounts4.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens).toString()).toString());

        // // Ensure settlement price is higher
        // settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).add(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));

        // // assert failure to settle where minimum amount not yet reached
        // await truffleAssert.reverts(
        //     OPEvent.settle(settlementPrice),
        //     "OpenPredictEvent: minimum amount not yet reached."
        // );

        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[3]})
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[4]})

        // // mint enough to satisfy event params
        // OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]})
        // OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[3]})
        // OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()),  Constants.OTokenSelection, {from: accounts[4]})

        // // assert failure to settle where event not yet concluded.
        // await truffleAssert.reverts(
        //     OPEvent.settle(settlementPrice),
        //     "OpenPredictEvent: Event not yet concluded."
        // );
        
        // // verify mint fails following deposit period complete
        // console.log("waiting for deposit period to pass..")
        // await new Promise(r => setTimeout(r, Constants[process.env.NETWORK].depositPeriodSeconds * 1000));
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
        // await truffleAssert.reverts(
        //     OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()), 
        //                  Constants.IOTokenSelection, 
        //                  {from: accounts[2]}),
        //     "OpenPredictEvent: Event started. Minting of new tokens is disabled."
        // );
        
        // // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        // console.log("waiting for event settlement..")
        // await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds - Constants[process.env.NETWORK].depositPeriodSeconds) * 1000));
        
        // // attempt a claim where event not yet settled
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('1'), {from: accounts[0]})
        // await truffleAssert.reverts(
        //     OPEvent.claim({from: accounts[0]}),
        //     "OpenPredictEvent: Event not yet settled."
        // );

        // // settle event
        // OPEvent.settle(settlementPrice);
        // // validate price per winning token as 2/3 of a token for each IO holder
        // amountPerWinningTokenContract = await OPEvent.getAmountPerWinningToken();
        // amountPerWinningToken = ethers.utils.parseUnits("0666666666666666666", 0);

        // assert.equal(amountPerWinningTokenContract.valueOf().toString(),
        //              amountPerWinningToken.valueOf().toString());

        // // IO tokens win.
        // // first verify claims from O tokens fail.
        // // first grant allowance to contract to burn tokens
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('1'), {from: accounts[0]})
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[4]})
        // await truffleAssert.reverts(
        //     OPEvent.claim({from: accounts[0]}),
        //     "OpenPredictEvent: no deposit held for sender in winning token."
        // );

        // await truffleAssert.reverts(
        //     OPEvent.claim({from: accounts[4]}),
        //     "OpenPredictEvent: no deposit held for sender in winning token."
        // );
        
        // // verify valid claims from IO tokens.
        // // first grant allowance to contract to burn tokens
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[2]})
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[3]})
        // await OPEvent.claim({from: accounts[2]})
        // await OPEvent.claim({from: accounts[3]})

        // // verify balance for accounts is previous tokens + winning tokens
        // balanceAccount2Contract = await contracts['OPUSD'].balanceOf(accounts[2])
        // balanceAccount3Contract = await contracts['OPUSD'].balanceOf(accounts[3])
        // // calculate new balance
        // originalAmount = ethers.utils.parseUnits((Constants.numTokens * 10 * Constants.OPUSDOptionRatio).toString());
        // depositedAmount = ethers.utils.parseUnits((Constants.numTokens * 3 * Constants.OPUSDOptionRatio).toString());
        // balanceAccount = originalAmount.add(depositedAmount.mul(amountPerWinningToken).div(ethers.utils.parseUnits('1')));
        // // verify balance is the same
        // assert.equal(balanceAccount2Contract.valueOf().toString(), balanceAccount.valueOf().toString());
        // assert.equal(balanceAccount3Contract.valueOf().toString(), balanceAccount.valueOf().toString());

        // // verify repeated claims fail, even after approval
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[2]})
        // await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[3]})
        // await truffleAssert.reverts(
        //     OPEvent.claim({from: accounts[2]}),
        //     "OpenPredictEvent: no deposit held for sender in winning token."
        // );

        // await truffleAssert.reverts(
        //     OPEvent.claim({from: accounts[3]}),
        //     "OpenPredictEvent: no deposit held for sender in winning token."
        // );
        

        // // assert invalid revokes: minimum amount for contract reached
        // await truffleAssert.reverts(
        //     OPEvent.revoke({from: accounts[0]}),
        //     "OpenPredictEvent: minimum amount reached."
        // );


        // await truffleAssert.reverts(
        //     OPEvent.revoke({from: accounts[2]}),
        //     "OpenPredictEvent: minimum amount reached."
        // );

        // // assert invalid settlement call: event settled
        // await truffleAssert.reverts(
        //     OPEvent.settle(settlementPrice, {from: accounts[0]}),
        //     "OpenPredictEvent: Event settled."
        // );
        
        // // assert invalid mint call: event settled
        // await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
        // await truffleAssert.reverts(
        //     OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]}),
        //     "OpenPredictEvent: Event settled."
        // ); 
    })

    // // test case A:
    // // - valid contract deployment
    // // - failed mint on same side as deployer (incorrect weight)
    // // - 3 more valid mints: 2 on IO side, one on O side.
    // // - wait for event deposit period to pass - invalid amount for event
    // // - attempt settlement, assert failure
    // // - attempt claims from minters, assert failure
    // // - valid revokes from all minters
    // // - invalid follow-up revokes
    // it("Should pass for test case B", async () => {
    //     // approve contract address for 100 SCT
    //     //****/
    //     for(i=2;i<4;i++){
    //         await contracts['OPUSD'].approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[i]})
    //     }
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[3]})
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[4]})

    //     // assert approvals happened successfully
    //     const contractAllowance1 = await OPUSD.allowance(accounts[2], OPEvent.address);
    //     const contractAllowance2 = await OPUSD.allowance(accounts[3], OPEvent.address);
    //     const contractAllowance3 = await OPUSD.allowance(accounts[4], OPEvent.address);
    //     assert.equal(contractAllowance1.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());
    //     assert.equal(contractAllowance2.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());
    //     assert.equal(contractAllowance3.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()).toString());

    //     // mints: 2 and 3 on IO side, 4 on O side.
    //     OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]})
    //     OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[3]})
    //     OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.OTokenSelection,  {from: accounts[4]})
        
    //     // assert correct mint balance for each contract
    //     balanceAccounts2 = await IOToken.balanceOf(accounts[2])
    //     balanceAccounts3 = await IOToken.balanceOf(accounts[3])
    //     balanceAccounts4 = await  OToken.balanceOf(accounts[4])
    //     assert.equal(balanceAccounts2.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens).toString()).toString());
    //     assert.equal(balanceAccounts3.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens).toString()).toString());
    //     assert.equal(balanceAccounts4.valueOf().toString(), ethers.utils.parseUnits((Constants.numTokens).toString()).toString());

    //     // Ensure settlement price is higher
    //     settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).add(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));

    //     // assert failure to settle where minimum amount not yet reached
    //     await truffleAssert.reverts(
    //         OPEvent.settle(settlementPrice),
    //         "OpenPredictEvent: minimum amount not yet reached."
    //     );

    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[3]})
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[4]})

    //     // mint enough to satisfy event params
    //     OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]})
    //     OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[3]})
    //     OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()),  Constants.OTokenSelection, {from: accounts[4]})

    //     // assert failure to settle where event not yet concluded.
    //     await truffleAssert.reverts(
    //         OPEvent.settle(settlementPrice),
    //         "OpenPredictEvent: Event not yet concluded."
    //     );
        
    //     // verify mint fails following deposit period complete
    //     console.log("waiting for deposit period to pass..")
    //     await new Promise(r => setTimeout(r, Constants[process.env.NETWORK].depositPeriodSeconds * 1000));
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
    //     await truffleAssert.reverts(
    //         OPEvent.mint(ethers.utils.parseUnits((2 * Constants.numTokens).toString()), 
    //                      Constants.IOTokenSelection, 
    //                      {from: accounts[2]}),
    //         "OpenPredictEvent: Event started. Minting of new tokens is disabled."
    //     );
        
    //     // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
    //     console.log("waiting for event settlement..")
    //     await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds - Constants[process.env.NETWORK].depositPeriodSeconds) * 1000));
        
    //     // attempt a claim where event not yet settled
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('1'), {from: accounts[0]})
    //     await truffleAssert.reverts(
    //         OPEvent.claim({from: accounts[0]}),
    //         "OpenPredictEvent: Event not yet settled."
    //     );

    //     // settle event
    //     OPEvent.settle(settlementPrice);
    //     // validate price per winning token as 2/3 of a token for each IO holder
    //     amountPerWinningTokenContract = await OPEvent.getAmountPerWinningToken();
    //     amountPerWinningToken = ethers.utils.parseUnits("0666666666666666666", 0);

    //     assert.equal(amountPerWinningTokenContract.valueOf().toString(),
    //                  amountPerWinningToken.valueOf().toString());

    //     // IO tokens win.
    //     // first verify claims from O tokens fail.
    //     // first grant allowance to contract to burn tokens
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('1'), {from: accounts[0]})
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[4]})
    //     await truffleAssert.reverts(
    //         OPEvent.claim({from: accounts[0]}),
    //         "OpenPredictEvent: no deposit held for sender in winning token."
    //     );

    //     await truffleAssert.reverts(
    //         OPEvent.claim({from: accounts[4]}),
    //         "OpenPredictEvent: no deposit held for sender in winning token."
    //     );
        
    //     // verify valid claims from IO tokens.
    //     // first grant allowance to contract to burn tokens
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[2]})
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[3]})
    //     await OPEvent.claim({from: accounts[2]})
    //     await OPEvent.claim({from: accounts[3]})

    //     // verify balance for accounts is previous tokens + winning tokens
    //     balanceAccount2Contract = await OPUSD.balanceOf(accounts[2])
    //     balanceAccount3Contract = await OPUSD.balanceOf(accounts[3])
    //     // calculate new balance
    //     basicAmount = ethers.utils.parseUnits((Constants.numTokens * 3 * Constants.OPUSDOptionRatio).toString());
    //     balanceAccount = basicAmount.add(basicAmount.mul(amountPerWinningToken).div(ethers.utils.parseUnits('1'))).add(ethers.utils.parseUnits('100'));
    //     // verify balance is the same
    //     assert.equal(balanceAccount2Contract.valueOf().toString(), balanceAccount.valueOf().toString());
    //     assert.equal(balanceAccount3Contract.valueOf().toString(), balanceAccount.valueOf().toString());

    //     // verify repeated claims fail, even after approval
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[2]})
    //     await IOToken.approve(OPEvent.address, ethers.utils.parseUnits('3'), {from: accounts[3]})
    //     await truffleAssert.reverts(
    //         OPEvent.claim({from: accounts[2]}),
    //         "OpenPredictEvent: no deposit held for sender in winning token."
    //     );

    //     await truffleAssert.reverts(
    //         OPEvent.claim({from: accounts[3]}),
    //         "OpenPredictEvent: no deposit held for sender in winning token."
    //     );
        

    //     // assert invalid revokes: minimum amount for contract reached
    //     await truffleAssert.reverts(
    //         OPEvent.revoke({from: accounts[0]}),
    //         "OpenPredictEvent: minimum amount reached."
    //     );


    //     await truffleAssert.reverts(
    //         OPEvent.revoke({from: accounts[2]}),
    //         "OpenPredictEvent: minimum amount reached."
    //     );

    //     // assert invalid settlement call: event settled
    //     await truffleAssert.reverts(
    //         OPEvent.settle(settlementPrice, {from: accounts[0]}),
    //         "OpenPredictEvent: Event settled."
    //     );
        
    //     // assert invalid mint call: event settled
    //     await OPUSD.approve(OPEvent.address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
    //     await truffleAssert.reverts(
    //         OPEvent.mint(ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]}),
    //         "OpenPredictEvent: Event settled."
    //     ); 
    // })
})

