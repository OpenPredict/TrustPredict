const ERC20             = artifacts.require("ERC20Mock");
const Utils             = artifacts.require("Utils");
const Oracle            = artifacts.require("Oracle");
const TrustPredictToken = artifacts.require('TrustPredictToken');
const OPEventFactory    = artifacts.require("OPEventFactory");

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const utils = require('../utils.js');
const ethers = require('ethers');
const { AssertionError } = require("chai");
let Constants = utils.Constants

USDCTokenValue = ethers.utils.parseUnits((Constants.numTokens * 1000 * Constants.AssetOptionRatio).toString())

//encode constructor arguments
defaultArgs = []
defaultArgs[Constants.betPrice] = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2);
defaultArgs[Constants.betSide] = Constants.Lower
defaultArgs[Constants.eventPeriod] = Math.floor(new Date().getTime() / 1000) + Constants[process.env.NETWORK].eventPeriodSeconds
defaultArgs[Constants.numTokensToMint] = ethers.utils.parseUnits(Constants.numTokens.toString());
defaultArgs[Constants.priceAggregator] = Constants.pairings['ETH/USD']

async function sendTokensToAddresses(contracts, accounts) {
    // send enough USDC for 10 tokens per account
    const range = (account,index) => index > 0;
    await Promise.all(accounts.filter(range).map(async (account) => {
        await contracts['Asset'].mint(account, USDCTokenValue);
        const balance = await contracts['Asset'].balanceOf.call(account);
        assert.equal(balance.valueOf().toString(), USDCTokenValue.valueOf().toString());
    }))
}

async function deployEvent(contracts, accounts, args, shouldFail, revertMessage) {
    // get deployer address nonce
    nonce = await contracts['OPEventFactory'].nonce();
    console.log('nonce: ' + nonce);

    // contract address creation starts at nonce 1, so we emulate that for the Event ID.
    OPEventID = utils.getNextContractAddress(contracts['OPEventFactory'].address, nonce++)


    // approve OPEventFactory address for 100 USDC (ie. 1 Yes Token) from deployer address
    console.log("USDC approve..")
    await contracts['Asset'].approve(contracts['OPEventFactory'].address, 
                        args[Constants.numTokensToMint].mul(Constants.AssetOptionRatio), 
                        {from: accounts[1]})
    // assert approval happened successfully
    const USDCAllowance = await contracts['Asset'].allowance(accounts[1], contracts['OPEventFactory'].address);
    assert.equal(USDCAllowance.valueOf().toString(), 
                 (args[Constants.numTokensToMint].mul(Constants.AssetOptionRatio)).toString());

    args[Constants.eventPeriod] = Math.floor(new Date().getTime() / 1000) + Constants[process.env.NETWORK].eventPeriodSeconds
    // deploy event
    console.log("Event deployment..")
    if(!(shouldFail)){
        await contracts['OPEventFactory'].createOPEvent(
            args[Constants.betPrice], 
            args[Constants.betSide], 
            args[Constants.eventPeriod], 
            args[Constants.numTokensToMint],
            args[Constants.priceAggregator],
            contracts['Asset'].address,
            {from: accounts[1], gas: 10000000});

            YesToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.YesTokenSelection)
            NoToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.NoTokenSelection)
            console.log('OPEventID: ' + OPEventID);
            console.log('YesToken: ' + YesToken);
            console.log('NoToken: ' + NoToken);

            //eventData = await contracts['OPEventFactory'].events(OPEventID)
            //console.log('EventData: ' + JSON.stringify(eventData));

            return [OPEventID, YesToken, NoToken];
    }else{
        // assert it overflows with maxUint setting
        await truffleAssert.reverts(
            contracts['OPEventFactory'].createOPEvent(
                args[Constants.betPrice], 
                args[Constants.betSide], 
                args[Constants.eventPeriod], 
                args[Constants.numTokensToMint],
                args[Constants.priceAggregator],
                contracts['Asset'].address,
                {from: accounts[1], gas: 10000000}),
                revertMessage
        ); 
    }

}

async function deployPrelaunchEvent(contracts, account, args, shouldFail, revertMessage) {
    // get deployer address nonce
    nonce = await contracts['OPEventFactory'].nonce();
    console.log('nonce: ' + nonce);

    // contract address creation starts at nonce 1, so we emulate that for the Event ID.
    OPEventID = utils.getNextContractAddress(contracts['OPEventFactory'].address, nonce++)

    args[Constants.eventPeriod] = Math.floor(new Date().getTime() / 1000) + Constants[process.env.NETWORK].eventPeriodSeconds
    //console.log('args: ' + JSON.stringify(args));
    // deploy event
    console.log("Event deployment..")
    if(!(shouldFail)){
        await contracts['OPEventFactory'].createPrelaunchEvent(
            args[Constants.betPrice], 
            contracts['Asset'].address,
            args[Constants.eventPeriod],
            {from: account, gas: 10000000});

            YesToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.YesTokenSelection)
            NoToken = await contracts['TrustPredict'].getToken(OPEventID, Constants.NoTokenSelection)
            console.log('OPEventID: ' + OPEventID);
            console.log('YesToken: ' + YesToken);
            console.log('NoToken: ' + NoToken);

            //eventData = await contracts['OPEventFactory'].events(OPEventID)
            //console.log('EventData: ' + JSON.stringify(eventData));

            return [OPEventID, YesToken, NoToken];
    }else{
        // assert it overflows with maxUint setting
        await truffleAssert.reverts(
            contracts['OPEventFactory'].createPrelaunchEvent(
                args[Constants.betPrice],
                contracts['Asset'].address, 
                args[Constants.eventPeriod],
                {from: account, gas: 10000000}),
                revertMessage
        ); 
    }

}

async function USDC_approve(contracts, accounts, start, end, amount){
    const range = (account,index) => index >= start && index <= end;
    await Promise.all(accounts.filter(range).map(async (account) => {
        await contracts['Asset'].approve(contracts['OPEventFactory'].address, 
                                         ethers.utils.parseUnits((amount).toString()), 
                                         {from: account})
        // assert approval happened successfully
        const contractAllowance = await contracts['Asset'].allowance(account, contracts['OPEventFactory'].address);
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

async function OPEventFactory_revokableWithdraw(contracts, accounts, start, end, eventId, success, revertMsg) {
    const range = (account,index) => index >= start && index <= end;
    await Promise.all(accounts.filter(range).map(async (account) => {
        const call = contracts['OPEventFactory'].revokableWithdraw(eventId, {from: account })
        success ? await call : await truffleAssert.reverts(call, revertMsg);
        console.log("finish revoke for " + account)
    }));
}

contract("TrustPredict", async (accounts) => {
    let contracts = []

    before( async () => {
        contracts['Asset'] = await ERC20.new("USD Coin", "USDC", ethers.utils.parseUnits('100000'));
        contracts['Utils'] = await Utils.new();
        contracts['Oracle'] = await Oracle.new();
        contracts['TrustPredict'] = await TrustPredictToken.new();
        
        await OPEventFactory.link("Utils", contracts['Utils'].address);
        contracts['OPEventFactory'] = await OPEventFactory.new(
            contracts['Oracle'].address,
            contracts['TrustPredict'].address,
            contracts['Asset'].address,
            315360000,
            ethers.utils.parseUnits('10'),
            2,
            Constants['development'].depositPeriodSeconds,
            ethers.utils.parseUnits('100'),
            Constants['development'].voidPeriodSeconds,
        );

        await contracts['TrustPredict'].setFactory(contracts['OPEventFactory'].address, true);

        // Give all accounts 1000 USDC
        await sendTokensToAddresses(contracts, accounts);
    })

    afterEach( async () => {
        console.log("excuting after hook..")
        // burn existing and reset balance to 1000 for all
        await Promise.all(accounts.filter((account, index) => index > 0).map(async (account) => {
            const balance = await contracts['Asset'].balanceOf.call(account);
            await contracts['Asset'].burn(account, balance);
            await contracts['Asset'].mint(account, USDCTokenValue);
        }));
    })

    // test case A:
    // - valid event deployment
    // - 3 more valid stakes: 2 on No side, one on Yes side.
    // - failed attempt to settle before minimum amount reached
    // - 6 more stakes, 3 either side. minimum amount reached
    // - valid settlement on Yes side
    // - 2 valid O claims, 2 invalid No claims, with values for valid claims asserted
    // - invalid claim from same address on Yes token side
    // - invalid revokes from all addresses involved
    // - invalid settlement call
    // - invalid mint call
    it("Should pass for test case A", async () => {

        // Mint tokens to addresses
        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        // Approve USDC to event contract from accounts 2-4 
        await USDC_approve(contracts, accounts, 2, 4, Constants.numTokens * Constants.AssetOptionRatio);

        // // stake: 2 and 3 on No side, 4 on Yes side.
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.YesTokenSelection };
        await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
        await OPEventFactory_stake(contracts, accounts, stake, 4, 4);

        // assert it overflows with maxUint setting
        // await truffleAssert.reverts(
        //     contracts['OPEventFactory'].stake(OPEventID,
        //                                       ethers.constants.MaxUint256,
        //                                       Constants.NoTokenSelection),
        //     "Error: Returned error: VM Exception while processing transaction: revert"
        // );

        // Ensure settlement price is higher
        settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).add(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));

        // assert failure to settle where minimum amount not yet reached
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice),
            "OPEventFactory: minimum amount not yet reached."
        );

        await USDC_approve(contracts, accounts, 2, 4, 2 * Constants.numTokens * Constants.AssetOptionRatio); 
        // // mint enough to satisfy event params
        for(i=0;i<2;i++){
            await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
            await OPEventFactory_stake(contracts, accounts, stake, 4, 4);
        }
        
        // assert failure to settle where event not yet concluded.
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice),
            "OPEventFactory: Event not yet concluded."
        );
        
        // verify mint fails following deposit period complete
        console.log("waiting for deposit period to pass..")
        await new Promise(r => setTimeout(r, Constants[process.env.NETWORK].depositPeriodSeconds * 1000));
        await contracts['Asset'].approve(contracts['OPEventFactory'].address, ethers.utils.parseUnits((2 * Constants.numTokens * Constants.AssetOptionRatio).toString()), {from: accounts[2]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                                              ethers.utils.parseUnits((2 * Constants.numTokens).toString()), 
                                              Constants.NoTokenSelection, 
                                              {from: accounts[2]}),
            "OPEventFactory: Event started. Minting of new tokens is disabled."
        );
        
        // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        console.log("waiting for event settlement..")
        await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds - Constants[process.env.NETWORK].depositPeriodSeconds) * 1000));
        
        // attempt a claim from account 0, fails with no tokens for sender
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[0]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].claim(OPEventID, {from: accounts[0]}),
            "OPEventFactory: no holdings for sender in winning token."
        );

        // settle event
        contracts['OPEventFactory'].settle(OPEventID, settlementPrice);
        // validate price per winning token as 2/3 of a token for each No holder
        eventData = await contracts['OPEventFactory'].events(OPEventID);
        amountPerWinningTokenContract = eventData['amountPerWinningToken'];
        amountPerWinningToken = ethers.utils.parseUnits("0666666666666666666", 0);

        assert.equal(amountPerWinningTokenContract.valueOf().toString(),
                     amountPerWinningToken.valueOf().toString());

        assert.equal(parseInt(eventData['winner']), Constants.NoTokenSelection);

        // No tokens win.
        // first verify claims from Yes tokens fail.
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
        
        // verify valid claims from No tokens.
        // first grant allowance to contract to burn tokens
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[2]})
        await contracts['TrustPredict'].setApprovalForAll(contracts['OPEventFactory'].address, true, {from: accounts[3]})
        await contracts['OPEventFactory'].claim(OPEventID, {from: accounts[2]})
        await contracts['OPEventFactory'].claim(OPEventID, {from: accounts[3]})

        // verify balance for accounts is previous tokens + winning tokens
        balanceAccount2Contract = await contracts['Asset'].balanceOf(accounts[2])
        balanceAccount3Contract = await contracts['Asset'].balanceOf(accounts[3])
        // calculate new balance
        depositedAmount = ethers.utils.parseUnits((Constants.numTokens * 3 * Constants.AssetOptionRatio).toString());
        balanceAccount = USDCTokenValue.add(depositedAmount.mul(amountPerWinningToken).div(ethers.utils.parseUnits('1')));
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
            contracts['OPEventFactory'].revokableWithdraw(OPEventID, {from: accounts[0]}),
            "OPEventFactory: minimum amount reached."
        );


        await truffleAssert.reverts(
            contracts['OPEventFactory'].revokableWithdraw(OPEventID, {from: accounts[2]}),
            "OPEventFactory: minimum amount reached."
        );

        // assert invalid settlement call: event settled
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice, {from: accounts[0]}),
            "OPEventFactory: Event settled."
        );
        
        // assert invalid mint call: event settled
        await contracts['Asset'].approve(contracts['OPEventFactory'].address, ethers.utils.parseUnits((Constants.numTokens * Constants.AssetOptionRatio).toString()), {from: accounts[2]})
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, ethers.utils.parseUnits((Constants.numTokens).toString()), Constants.NoTokenSelection, {from: accounts[2]}),
            "OPEventFactory: Event settled."
        );
    })

    // test case B:
    // - valid event deployment
    // - failed mint on same side as deployer (incorrect weight)
    // - 3 more valid stakes: 2 on No side, one on Yes side.
    // - wait for event deposit period to pass - invalid amount for event
    // - attempt settlement, assert failure
    // - attempt claims from minters, assert failure
    // - valid revokes from all minters
    // - invalid follow-up revokes
    it("Should pass for test case B", async () => {
        // - valid contract deployment
        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        await USDC_approve(contracts, accounts, 0, 2, Constants.numTokens * Constants.AssetOptionRatio);
        //await truffleAssert.reverts(
        contracts['OPEventFactory'].stake(OPEventID, 
                                            ethers.utils.parseUnits((Constants.numTokens).toString()), 
                                            Constants.YesTokenSelection, 
                                            {from: accounts[2]});
        
        // - 3 more valid stakes: 2 on No side, 1 on Yes side.
        await USDC_approve(contracts, accounts, 2, 4, Constants.numTokens * Constants.AssetOptionRatio);
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.YesTokenSelection };
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
        await OPEventFactory_claim(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount not yet reached.");


        // - valid revokes from all minters
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, true);

        // - invalid follow-up revokes
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: no holdings for sender in any token.");
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
        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        // - attempt revoke during deposit period
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: Event not yet started. Minting of new tokens is enabled.");
        
        // -  valid wagers to reach minimum amount
        await USDC_approve(contracts, accounts, 2, 4, 5 * Constants.numTokens * Constants.AssetOptionRatio);
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.YesTokenSelection };

        for(i = 0; i < 5; i++){
            await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
            await OPEventFactory_stake(contracts, accounts, stake, 4, 4);
        }
    
        // - attempt revoke before deposit period ends
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount reached");

        // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        console.log("waiting for event settlement..")
        await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds) * 1000));
        
        // - attempt revoke after deposit period ends
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount reached");

        // valid event settlement
        settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).sub(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));
        await contracts['OPEventFactory'].settle(OPEventID, settlementPrice);

    })

    // test case D:
    // - add account 1 as creator account
    // - valid event deployment from creator account
    // - attempt Prelaunch event deployment from non-creator account
    it("Should pass for test case D", async () => {

        // - valid contract deployment
        await contracts['OPEventFactory'].updateAdmins(accounts[1], true);

        IDs = await deployPrelaunchEvent(contracts, accounts[1], defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        // - attempt revoke during deposit period
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: Event not yet started. Minting of new tokens is enabled.");
        
        // -  valid wagers to reach minimum amount
        await USDC_approve(contracts, accounts, 2, 4, 5 * Constants.numTokens * Constants.AssetOptionRatio);
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.YesTokenSelection };

        for(i = 0; i < 5; i++){
            await OPEventFactory_stake(contracts, accounts, stake, 2, 3); // we require this call to be semi-syncronous so first call 2 and 3, and then 4
            await OPEventFactory_stake(contracts, accounts, stake, 4, 4);
        }
    
        // - attempt revoke before deposit period ends
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount reached");

        // wait for contract event to complete (waiting full amount, so includes some leeway for settle call)
        console.log("waiting for event conclusion..")
        await new Promise(r => setTimeout(r, (Constants[process.env.NETWORK].eventPeriodSeconds) * 1000));
        
        // - attempt revoke after deposit period ends
        await OPEventFactory_revokableWithdraw(contracts, accounts, 1, 4, OPEventID, false, "OPEventFactory: minimum amount reached");

        settlementPrice = ethers.utils.parseUnits(Constants.rawBetPrice, Constants.priceFeedDecimals - 2).sub(ethers.utils.parseUnits("2", Constants.priceFeedDecimals));

        // attempt to settle event from non-creator account
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, settlementPrice),
            "settle: attempt to settle prelaunch event from account other than creator."
        ); 
        // valid event settlement
        await contracts['OPEventFactory'].settle(OPEventID, settlementPrice, {from: accounts[1]});

        // Invalid deployment
        await deployPrelaunchEvent(contracts, accounts[0], defaultArgs, true, "OPEventFactory: Prelaunch event creator is not whitelisted.");

        // negate whitelist, invalid event deployment
        await contracts['OPEventFactory'].updateAdmins(accounts[1], false);
        await deployPrelaunchEvent(contracts, accounts[0], defaultArgs, true, "OPEventFactory: Prelaunch event creator is not whitelisted.");

    })

    // test case E (misc functions)
    it("Should pass for test case E", async () => {

        // - valid contract deployment
        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        // safeTransfer tokens to another account
        await contracts['TrustPredict'].transferFrom(OPEventID, accounts[1], accounts[2], ethers.utils.parseUnits('1'), Constants.YesTokenSelection,  {from: accounts[1]});

        // attempt to create tokens, mint and burn for OPEventID from any EOA. Here we try the event creation EOA
        await truffleAssert.reverts(
            contracts['TrustPredict'].createTokens(OPEventID,  {from: accounts[1]}),
            "TrustPredictToken: Caller is not the designated OPEventFactory address."
        ); 
        await truffleAssert.reverts(
            contracts['TrustPredict'].mint(OPEventID, accounts[1], ethers.utils.parseUnits('100'), Constants.YesTokenSelection,  {from: accounts[1]}),
            "TrustPredictToken: Caller is not the designated OPEventFactory address."
        );
        await truffleAssert.reverts(
            contracts['TrustPredict'].burn(OPEventID, accounts[1], ethers.utils.parseUnits('100'), Constants.YesTokenSelection,  {from: accounts[1]}),
            "TrustPredictToken: Caller is not the designated OPEventFactory address."
        );
    })

    // test case F
    // deploy event with more than maximum prediction amount, verify failure
    it("Should pass for test case F", async () => {

        // - valid contract deployment
        args = [...defaultArgs]
        args[Constants.numTokensToMint] = ethers.utils.parseUnits((Constants.initialMaxPrediction * 2).toString());
        await deployEvent(contracts, accounts, args, true, 'OPEventFactory: requested token amount exceeds current valid prediction amount.');
    })

    // test case G
    // deploy event with more than maximum prediction amount, verify failure
    it("Should pass for test case G", async () => {

        // deploy valid event, evenly distribute stakes.
        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        await USDC_approve(contracts, accounts, 0, 9, Constants.numTokens * 100 * Constants.AssetOptionRatio);
        // Try to mint more than 10% of outstanding pot
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                ethers.utils.parseUnits((Constants.initialMaxPrediction * 5).toString()),
                Constants.YesTokenSelection, 
                {from: accounts[0] }),
                "OPEventFactory: requested tokens would result in invalid weight on one side of the draw."
        );

        // try and mint invalid amount of tokens on one side of the draw
        stake = {}
        for(i=0; i<10; i+=2) {
            stake[accounts[i]  ] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.YesTokenSelection};    
            stake[accounts[i+1]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};  
            await OPEventFactory_stake(contracts, accounts, stake, i, i+1);  
        }
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                ethers.utils.parseUnits((Constants.initialMaxPrediction * 10).toString()),
                Constants.YesTokenSelection, 
                {from: accounts[0] }),
                "OPEventFactory: requested token amount exceeds current valid prediction amount."
        );
    })

    // test case H
    // deploy valid event
    // mint 86% Yes side, 6% No side
    // attempt mint 6% Yes side
    // verify incorrect weight
    it("Should pass for test case H", async () => {

        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        await USDC_approve(contracts, accounts, 0, 0, Constants.numTokens * 100 * Constants.AssetOptionRatio);

        // mint total of 86%: Yes side, 6%: No side
        // max 50% per stake
        await contracts['OPEventFactory'].stake(OPEventID, 
            ethers.utils.parseUnits((Constants.initialMaxPrediction).toString()),
            Constants.YesTokenSelection, 
            {from: accounts[0] }
        );

        // bring total up to 8.6
        await contracts['OPEventFactory'].stake(OPEventID, 
            ethers.utils.parseUnits((2.6).toString()),
            Constants.YesTokenSelection, 
            {from: accounts[0] }
        );

        await contracts['OPEventFactory'].stake(OPEventID, 
            ethers.utils.parseUnits((0.6).toString()),
            Constants.NoTokenSelection, 
            {from: accounts[0] }
        );

        // try mint 0.6 Yes side - valid for prediction amount, should fail at weight.
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                ethers.utils.parseUnits((0.6).toString()),
                Constants.YesTokenSelection, 
                {from: accounts[0] }
            ), "OPEventFactory: requested tokens would result in invalid weight on one side of the draw."
        );

        // try mint 1.5 No side - invalid for prediction amount
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                ethers.utils.parseUnits((Constants.initialMaxPrediction * 1.5).toString()),
                Constants.NoTokenSelection, 
                {from: accounts[0] }
            ), "OPEventFactory: requested token amount exceeds current valid prediction amount."
        );

    })

    // test case I
    // deploy valid event
    // try to voidWithdraw before concluded, verify failure
    // wait for void, 
    // try to settle, verify failure
    // valid voidWithdraw
    it("Should pass for test case I", async () => {

        IDs = await deployEvent(contracts, accounts, defaultArgs, false, '');
        OPEventID = IDs[0]
        YesToken = IDs[1]
        NoToken = IDs[2]

        // -  valid wagers to reach minimum amount
        await USDC_approve(contracts, accounts, 2, 4, 5 * Constants.numTokens * Constants.AssetOptionRatio);
        stake = {}
        stake[accounts[2]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[3]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.NoTokenSelection};
        stake[accounts[4]] = {"eventId": OPEventID, "numTokensToMint": Constants.numTokens, "selection": Constants.YesTokenSelection };

        for(i = 0; i < 5; i++){
            await OPEventFactory_stake(contracts, accounts, stake, 2, 3);
            await OPEventFactory_stake(contracts, accounts, stake, 4, 4);
        }

        // 
        await truffleAssert.reverts(
            contracts['OPEventFactory'].voidWithdraw(OPEventID,
                {from: accounts[0] }
            ), "OPEventFactory: Event not yet concluded."
        );

        // verify mint fails following deposit period complete
        console.log("waiting for event to become void..")
        let timeframe = Constants[process.env.NETWORK].depositPeriodSeconds + Constants[process.env.NETWORK].eventPeriodSeconds + Constants[process.env.NETWORK].voidPeriodSeconds;
        await new Promise(r => setTimeout(r, timeframe * 1000));

        //assert failure to settle following voided event
        await truffleAssert.reverts(
            contracts['OPEventFactory'].settle(OPEventID, 0),
            "OPEventFactory: Event voided."
        );
        
        // valid voidWithdraw
        await contracts['OPEventFactory'].voidWithdraw(OPEventID, {from: accounts[2]});

        //try to voidWithdraw from an account with no tokens
        await truffleAssert.reverts(
            contracts['OPEventFactory'].voidWithdraw(OPEventID,
                {from: accounts[5] }
            ), "OPEventFactory: no holdings for sender in any token."
        );

        //try to stake following void
        await truffleAssert.reverts(
            contracts['OPEventFactory'].stake(OPEventID, 
                                              ethers.utils.parseUnits((Constants.numTokens).toString()), 
                                              Constants.NoTokenSelection),
            "OPEventFactory: Event voided."
        );
    })
})