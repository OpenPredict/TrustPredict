const OPUSDToken = artifacts.require('OPUSDToken');
const ChainLinkToken = artifacts.require('ChainLinkToken');
const Utils = artifacts.require('Utils');
const Oracle = artifacts.require('Oracle');
const OPEventFactory = artifacts.require('OPEventFactory');
const TrustPredictToken = artifacts.require('TrustPredictToken');

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const utils = require('../utils.js');
const ethers = require('ethers');
const { AssertionError } = require("chai");
let Constants = utils.Constants

OPUSDTokenValue = ethers.utils.parseUnits((Constants.numTokens * 1000 * Constants.OPUSDOptionRatio).toString())


async function sendTokensToAddresses(contracts, accounts) {
    // send enough OPUSD for 10 tokens per account
    const range = (account,index) => index > 0;
    await Promise.all(accounts.filter(range).map(async (account) => {
        await contracts['OPUSD'].mint(account, OPUSDTokenValue);
        const balance = await contracts['OPUSD'].balanceOf.call(account);
        assert.equal(balance.valueOf().toString(), OPUSDTokenValue.valueOf().toString());
    }))

    // send enough LINK for 10 contract deployments to account 1
    ChainLinkTokenValue = ethers.utils.parseUnits((Constants.numTokens * 10).toString())
    await contracts['ChainLink'].transfer(accounts[1], ChainLinkTokenValue);
    const balance = await contracts['ChainLink'].balanceOf.call(accounts[1]);
    assert.equal(balance.valueOf().toString(), ChainLinkTokenValue.valueOf().toString());
}

async function deployEvent(contracts, accounts) {
    // get deployer address nonce
    nonce = await contracts['OPEventFactory'].getNonce();
    console.log('nonce: ' + nonce);

    // contract address creation starts at nonce 1, so we emulate that for the Event ID.
    OPEventID = utils.getNextContractAddress(contracts['OPEventFactory'].address, nonce++)

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

    // deploy event
    await contracts['OPEventFactory'].createOPEvent(args[Constants.betPrice], 
                                                    args[Constants.betSide], 
                                                    args[Constants.eventPeriod], 
                                                    args[Constants.numTokensToMint],
                                                    args[Constants.priceAggregator],
                                                    {from: accounts[1], gas: 10000000});
    
    
    
    OToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.OTokenSelection)
    IOToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.IOTokenSelection)
    console.log('OPEventID: ' + OPEventID);
    console.log('OToken: ' + OToken);
    console.log('IOToken: ' + IOToken);

    eventData = await contracts['OPEventFactory'].getEventData(OPEventID)
    console.log('EventData: ' + eventData);

    return [OPEventID, OToken, IOToken];
}

async function OPUSD_approve(contracts, accounts, start, end, amount){
    const range = (account,index) => index >= start && index <= end;
    await Promise.all(accounts.filter(range).map(async (account) => {
        await contracts['OPUSD'].approve(contracts['OPEventFactory'].address, 
                                         ethers.utils.parseUnits((amount).toString()), 
                                         {from: account})
        // assert approval happened successfully
        const contractAllowance = await contracts['OPUSD'].allowance(account, contracts['OPEventFactory'].address);
        assert.equal(contractAllowance.valueOf().toString(), ethers.utils.parseUnits((amount).toString()).toString());
    }));
}

async function OPEventFactory_stake(contracts, accounts, arguments, start, end){
    const range = (account,index) => index >= start && index <= end;
    await Promise.all(accounts.filter(range).map(async (account) => {
        argument = arguments[account];
        balanceBefore = await contracts['TrustPredict'].balanceOfAddress.call(argument.eventId, 
                                                                              account, 
                                                                              argument.selection)
        await contracts['OPEventFactory'].stake(argument.eventId, 
                                                ethers.utils.parseUnits((argument.numTokensToMint).toString()), 
                                                argument.selection, 
                                                {from: account })                                             
        // // assert correct staked balance
        balanceAfter = await contracts['TrustPredict'].balanceOfAddress.call(argument.eventId, 
                                                                             account, 
                                                                             argument.selection)

        balanceLocal = ethers.utils.parseUnits((argument.numTokensToMint).toString());
        if(balanceBefore > 0) { 
            balanceLocal = balanceLocal.add(ethers.BigNumber.from(balanceBefore.valueOf().toString()));
        }
        assert.equal(balanceAfter.valueOf().toString(), balanceLocal.valueOf().toString());
    }));
}

async function OPEventFactory_claim(contracts, accounts, start, end, eventId, success, revertMsg) {
    const range = (account,index) => index >= start && index <= end;
    await Promise.all(accounts.filter(range).map(async (account) => {
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: account })
        const call = contracts['OPEventFactory'].claim(eventId, {from: account })
        success ? await call : await truffleAssert.reverts(call, revertMsg);
        console.log("finish claim for " + account)
    }));
}

async function OPEventFactory_revoke(contracts, accounts, start, end, eventId, success, revertMsg) {
    const range = (account,index) => index >= start && index <= end;
    await Promise.all(accounts.filter(range).map(async (account) => {
        const call = contracts['OPEventFactory'].revoke(eventId, {from: account })
        success ? await call : await truffleAssert.reverts(call, revertMsg);
        console.log("finish revoke for " + account)
    }));
}

contract("TrustPredict", async (accounts) => {
    let contracts = []

    before( async () => {
        let accountIndex = 0
        contracts['OPUSD']          = await OPUSDToken.at(       utils.getNextContractAddress(accounts[0], accountIndex++));
        contracts['ChainLink']      = await ChainLinkToken.at(   utils.getNextContractAddress(accounts[0], accountIndex++));
        contracts['Utils']          = await Utils.at(            utils.getNextContractAddress(accounts[0], accountIndex++));
        contracts['Oracle']         = await Oracle.at(           utils.getNextContractAddress(accounts[0], accountIndex++));
        contracts['TrustPredict']   = await TrustPredictToken.at(utils.getNextContractAddress(accounts[0], accountIndex++));
        contracts['OPEventFactory'] = await OPEventFactory.at(   utils.getNextContractAddress(accounts[0], accountIndex++));
        // Give all accounts 1000 OPUSD
        await sendTokensToAddresses(contracts, accounts);
    })

    afterEach( async () => {
        console.log("excuting after hook..")
        // burn existing and reset balance to 1000 for all
        await Promise.all(accounts.filter((account, index) => index > 0).map(async (account) => {
            const balance = await contracts['OPUSD'].balanceOf.call(account);
            await contracts['OPUSD'].burn(account, balance);
            await contracts['OPUSD'].mint(account, OPUSDTokenValue);
        }));
    })

    // test case A:
    // - valid event deployment
    // - 3 more valid stakes: 2 on IO side, one on O side.
    // - failed attempt to settle before minimum amount reached
    // - 6 more stakes, 3 either side. minimum amount reached
    // - valid settlement on O side
    // - 2 valid O claims, 2 invalid IO claims, with values for valid claims asserted
    // - invalid claim from same address on O token side
    // - invalid revokes from all addresses involved
    // - invalid settlement call
    // - invalid mint call
    it("Should pass for test case A", async () => {

        // Mint tokens to addresses
        IDs = await deployEvent(contracts, accounts);
        OPEventID = IDs[0]
        OToken = IDs[1]
        IOToken = IDs[2]

        // Approve OPUSD to event contract from accounts 2-4 
        await OPUSD_approve(contracts, accounts, 2, 4, Constants.numTokens * Constants.OPUSDOptionRatio);

        // // stake: 2 and 3 on IO side, 4 on O side.
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.IOTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.IOTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.OTokenSelection };
        await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
        await OPEventFactory_stake(contracts, accounts, stake, 4, 4);

        // Ensure settlement price is higher
        settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).add(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));

        // assert failure to settle where minimum amount not yet reached
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice),
            "OPEventFactory: minimum amount not yet reached."
        );

        await OPUSD_approve(contracts, accounts, 2, 4, 2 * Constants.numTokens * Constants.OPUSDOptionRatio); 
        // // mint enough to satisfy event params
        stake[accounts[2]]['numTokensToMint'] *= 2;
        stake[accounts[3]]['numTokensToMint'] *= 2;
        stake[accounts[4]]['numTokensToMint'] *= 2;
        await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
        await OPEventFactory_stake(contracts, accounts, stake, 4, 4);


        // assert failure to settle where event not yet concluded.
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice),
            "OPEventFactory: Event not yet concluded."
        );
        
        // verify mint fails following deposit period complete
        console.log("waiting for deposit period to pass..")
        await new Promise(r => setTimeout(r, Constants[process.env.NETWORK].depositPeriodSeconds * 1000));
        await contracts['OPUSD'].approve(contracts['OPEventFactory'].address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                                              ethers.utils.parseUnits((2 * Constants.numTokens).toString()), 
                                              Constants.IOTokenSelection, 
                                              {from: accounts[2]}),
            "OPEventFactory: Event started. Minting of new tokens is disabled."
        );
        
        // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        console.log("waiting for event settlement..")
        await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds - Constants[process.env.NETWORK].depositPeriodSeconds) * 1000));
        
        // attempt a claim where event not yet settled
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[0]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].claim(OPEventID, {from: accounts[0]}),
            "OPEventFactory: Event not yet settled."
        );

        // settle event
        contracts['OPEventFactory'].settle(OPEventID, settlementPrice);
        // validate price per winning token as 2/3 of a token for each IO holder
        eventData = await contracts['OPEventFactory'].getEventData(OPEventID);
        amountPerWinningTokenContract = eventData['amountPerWinningToken'];
        amountPerWinningToken = ethers.utils.parseUnits("0666666666666666666", 0);

        assert.equal(amountPerWinningTokenContract.valueOf().toString(),
                     amountPerWinningToken.valueOf().toString());

        assert.equal(parseInt(eventData['winner']), Constants.IOTokenSelection);

        // IO tokens win.
        // first verify claims from O tokens fail.
        // first grant allowance to contract to burn tokens
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[0]})
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[4]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].claim(OPEventID, {from: accounts[0]}),
            "OPEventFactory: no holdings for sender in winning token."
        );

        await truffleAssert.reverts(
            contracts['OPEventFactory'].claim(OPEventID, {from: accounts[4]}),
            "OPEventFactory: no holdings for sender in winning token."
        );
        
        // verify valid claims from IO tokens.
        // first grant allowance to contract to burn tokens
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[2]})
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[3]})
        await contracts['OPEventFactory'].claim(OPEventID, {from: accounts[2]})
        await contracts['OPEventFactory'].claim(OPEventID, {from: accounts[3]})

        // verify balance for accounts is previous tokens + winning tokens
        balanceAccount2Contract = await contracts['OPUSD'].balanceOf(accounts[2])
        balanceAccount3Contract = await contracts['OPUSD'].balanceOf(accounts[3])
        // calculate new balance
        originalAmount = ethers.utils.parseUnits((Constants.numTokens * 10 * Constants.OPUSDOptionRatio).toString());
        depositedAmount = ethers.utils.parseUnits((Constants.numTokens * 3 * Constants.OPUSDOptionRatio).toString());
        balanceAccount = originalAmount.add(depositedAmount.mul(amountPerWinningToken).div(ethers.utils.parseUnits('1')));
        // verify balance is the same
        assert.equal(balanceAccount2Contract.valueOf().toString(), balanceAccount.valueOf().toString());
        assert.equal(balanceAccount3Contract.valueOf().toString(), balanceAccount.valueOf().toString());

        // verify repeated claims fail, even after approval
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[2]})
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[3]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].claim(OPEventID, {from: accounts[2]}),
            "OPEventFactory: no holdings for sender in winning token."
        );

        await truffleAssert.reverts(
            contracts['OPEventFactory'].claim(OPEventID, {from: accounts[3]}),
            "OPEventFactory: no holdings for sender in winning token."
        );
        

        // assert invalid revokes: minimum amount for contract reached
        await truffleAssert.reverts(
            contracts['OPEventFactory'].revoke(OPEventID, {from: accounts[0]}),
            "OPEventFactory: minimum amount reached."
        );


        await truffleAssert.reverts(
            contracts['OPEventFactory'].revoke(OPEventID, {from: accounts[2]}),
            "OPEventFactory: minimum amount reached."
        );

        // assert invalid settlement call: event settled
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice, {from: accounts[0]}),
            "OPEventFactory: Event settled."
        );
        
        // assert invalid mint call: event settled
        await contracts['OPUSD'].approve(contracts['OPEventFactory'].address, ethers.utils.parseUnits((Constants.numTokens * Constants.OPUSDOptionRatio).toString()), {from: accounts[2]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.IOTokenSelection, {from: accounts[2]}),
            "OPEventFactory: Event settled."
        );
    })

    // test case B:
    // - valid event deployment
    // - failed mint on same side as deployer (incorrect weight)
    // - 3 more valid stakes: 2 on IO side, one on O side.
    // - wait for event deposit period to pass - invalid amount for event
    // - attempt settlement, assert failure
    // - attempt claims from minters, assert failure
    // - valid revokes from all minters
    // - invalid follow-up revokes
    it("Should pass for test case B", async () => {
        // - valid contract deployment
        IDs = await deployEvent(contracts, accounts);
        OPEventID = IDs[0]
        OToken = IDs[1]
        IOToken = IDs[2]

        // - failed mint on same side as deployer (incorrect weight)
        await OPUSD_approve(contracts, accounts, 0, 0, Constants.numTokens * Constants.OPUSDOptionRatio);
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                                              ethers.utils.parseUnits((Constants.numTokens).toString()), 
                                              Constants.OTokenSelection, 
                                              {from: accounts[2]}),
        "OPEventFactory: requested tokens would result in invalid weight on one side of the draw.");
        
        // - 3 more valid stakes: 2 on IO side, 1 on O side.
        await OPUSD_approve(contracts, accounts, 2, 4, Constants.numTokens * Constants.OPUSDOptionRatio);
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.IOTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.IOTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.OTokenSelection };
        await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
        await OPEventFactory_stake(contracts, accounts, stake, 4, 4);
        

        // - wait for event deposit period to pass, resulting in invalid amount for event
        console.log("waiting for deposit period to pass..")
        await new Promise(r => setTimeout(r, Constants[process.env.NETWORK].depositPeriodSeconds * 1000));
        
        // - attempt settlement, assert failure
        settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).add(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice),
            "OPEventFactory: minimum amount not yet reached."
        );

        // - attempt claims from minters, assert failure
        const range = (account, index) => { index >= 1 && index <= 4 };
        await OPEventFactory_claim(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: Event not yet settled.");


        // - valid revokes from all minters
        //await OPEventFactory_revoke(contracts, accounts, 1, 4, OPEventID, true);

        // - invalid follow-up revokes
        //await OPEventFactory_revoke(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: no holdings for sender in any token.");
    })


    // test case C:
    // - valid event deployment
    // - attempt revoke during deposit period
    // - valid wagers to reach minimum amount
    // - attempt revoke before deposit period ends
    // - wait for event deposit period to pass, valid event started
    // - attempt revoke after deposit period ends
    it("Should pass for test case C", async () => {

        // - valid contract deployment
        IDs = await deployEvent(contracts, accounts);
        OPEventID = IDs[0]
        OToken = IDs[1]
        IOToken = IDs[2]

        // - attempt revoke during deposit period
        await OPEventFactory_revoke(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: Event not yet started. Minting of new tokens is enabled.");
        
        // -  valid wagers to reach minimum amount
        await OPUSD_approve(contracts, accounts, 2, 4, 5 * Constants.numTokens * Constants.OPUSDOptionRatio);
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": 5 * Constants.numTokens, "selection": Constants.IOTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": 5 * Constants.numTokens, "selection": Constants.IOTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": 5 * Constants.numTokens, "selection": Constants.OTokenSelection };
        await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
        await OPEventFactory_stake(contracts, accounts, stake, 4, 4);
    
        // - attempt revoke before deposit period ends
        await OPEventFactory_revoke(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount reached");

        // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        console.log("waiting for event settlement..")
        await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds) * 1000));
        
        // - attempt revoke after deposit period ends
        await OPEventFactory_revoke(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount reached");

        // valid event settlement
        settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).sub(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));
        await contracts['OPEventFactory'].settle(OPEventID, settlementPrice);

    })
})