import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';
import { ethers } from 'ethers';

import { WEB3 } from '@app/web3';
import Web3 from 'web3';

const OPEvent    = require('@truffle/build/contracts/OPEvent.json');
const ChainLink  = require('@truffle/build/contracts/ChainLinkToken.json');
const OPUSD      = require('@truffle/build/contracts/OPUSDToken.json');

@Injectable({
  providedIn: 'root'
})
export class OpEventService {

  OPEventAddress: string;
  OracleAddress: string;

  constructor(
    private crypto: CryptoService,
    private _authQ: AuthQuery,
    @Inject(WEB3) private web3: Web3) { }

  async eventWager(rawBetPrice: any,
                   betSide: boolean,
                   eventPeriod: number,
                   numTokensStakedToMint: any,
                   pairContract: string ): Promise<boolean | string>{

    console.log(`Placing wager with | rawBetPrice: ${rawBetPrice}| betSide: ${betSide} | eventPeriod: ${eventPeriod} | numTokensStakedToMint: ${numTokensStakedToMint}  || pairContract: ${pairContract}`);

    return new Promise( async (resolve, reject) => {

      if (typeof betSide === undefined) {
        reject(
          new Error(`Wager is missing arguements `)
        );
      }

      // constants
      const contracts = [];
      const contractAddresses = [];
      contractAddresses['OPUSD'] = '0xB876a52ABD933a02426C31d8231e9B9352864214';
      contractAddresses['ChainLink'] = '0xa36085F69e2889c224210F603D836748e7dC0088';
      const OPUSDOptionRatio = 100;
      const priceFeedDecimals = 8;

      const _USER: any       = this._authQ.getValue();
      const _wallet: any = _USER.wallet;
      const _signer: any = _USER.signer;

      if (!_wallet || !_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }
      const betPrice        = ethers.utils.parseUnits((rawBetPrice           *              100).toString(), priceFeedDecimals - 2);
      const numTokensToMint = ethers.utils.parseUnits((numTokensStakedToMint / OPUSDOptionRatio).toString());

      const nonce = await this.web3.eth.getTransactionCount(_wallet);
      console.log('nonce:' + nonce);
      this.OPEventAddress = this.crypto.getNextContractAddress(_wallet, nonce + 2);
      this.OracleAddress  = this.crypto.getNextContractAddress(this.OPEventAddress, 1);

      contracts['ChainLink'] = new ethers.Contract(contractAddresses['ChainLink'], ChainLink.abi, _signer);
      contracts['OPUSD'] = new ethers.Contract(contractAddresses['OPUSD'], OPUSD.abi, _signer);

      try {
        const optionsCL = {};
        const optionsOP = {};
        const approveCL = contracts['ChainLink'].approve(this.OracleAddress,
                                                        ethers.utils.parseUnits('1'),
                                                        optionsCL );

        const approveOP = contracts['OPUSD'].approve(this.OPEventAddress,
                                                  ethers.utils.parseUnits(numTokensStakedToMint.toString()),
                                                  optionsOP );

        const waitForInteractions = Promise.all([approveCL, approveOP]);
        waitForInteractions.then( async (res) => {
                const approveCL = await res[0].wait();
                const approveOP = await res[1].wait();
                if (approveCL.status === 1 && approveOP.status === 1) {
                  const abi = new ethers.utils.Interface( OPEvent.abi );
                  const factory = new ethers.ContractFactory(abi, OPEvent.bytecode, _signer);
                  console.log(`Deploying contract with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} | numTokensToMint: ${numTokensToMint} || pairContract: ${pairContract} `);
                  const contract = await factory.deploy(betPrice, Number(betSide), eventPeriod, numTokensToMint, pairContract );
                  // The contract is not mined yet but check info
                  console.log(contract.address, contract.deployTransaction);
                  // You can wait for the contract to deploy... This will reject and error if the deployment
                  // fails, for example, gas limit was too low, or the constructor called `revert`
                  await contract.deployed();
                  resolve(true);
                }
              }).catch( err =>
                reject(
                  `Error during contract deployment ${JSON.stringify(err)}`
                )
              );
      } catch (error) {
        console.log();
        reject(
          new Error(error)
        );
      }
    });
  }
}
