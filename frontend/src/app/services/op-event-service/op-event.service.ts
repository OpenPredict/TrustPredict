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

  maxDecimals = 18
  tokenDecimals = 18
  priceFeedDecimals = 8
  OPUSDOptionRatio = 100  
  
  OPEventAddress: string 
  OracleAddress: string  
  
  constructor(
    private crypto: CryptoService,
    private _authQ: AuthQuery,
    @Inject(WEB3) private web3: Web3,) { }
  
    
    
  async eventWager(ethBasePrice: any,  betSide: boolean, eventPeriod: number, numTokensStakedToMint ): Promise<boolean | string>{
    
    console.log(`Placing wager with | ethBasePrice: ${ethBasePrice}| betSide: ${betSide} | eventPeriod: ${eventPeriod} || numTokensStakedToMint: ${numTokensStakedToMint} `)
    
   return new Promise( async (resolve, reject) => {
   
    if(typeof betSide == undefined) {
      reject(
        new Error(`Wager is missing arguements `)
      )
    }     

    let contracts = []
    let contract_addresses = []
        contract_addresses['OPUSD'] = '0xb5f4d40279Aaa89F7F556558C789D1816C3D5122'
        contract_addresses['ChainLink'] = '0xa36085F69e2889c224210F603D836748e7dC0088'
        
    const _USER: any       = this._authQ.getValue()
    const _wallet: any = _USER.wallet
    const _signer: any = _USER.signer   
     
    if(!_wallet || !_signer) {
      reject(
        new Error(`Please log in via Metamask!`)
      )      
    } 

    // const ethBasePrice = "36015" // 360.15. Strings for BigNumber conversion
    const tokenDecimals = 18
    const priceFeedDecimals = 8

    // const betPrice = this.crypto.EncodeTokenAmount(ethBasePrice, priceFeedDecimals, 2);
    const betPrice = this.crypto.EncodeTokenAmount((ethBasePrice * 100), priceFeedDecimals, 2);
    const numTokensToMint = this.crypto.EncodeTokenAmount( (numTokensStakedToMint / 100), tokenDecimals, 0);

    let nonce = await this.web3.eth.getTransactionCount(_wallet);
    this.OPEventAddress = this.crypto.getNextContractAddress(_wallet, nonce+2)
    this.OracleAddress  = this.crypto.getNextContractAddress(this.OPEventAddress, 3);    
    
    contracts['ChainLink'] = new ethers.Contract(contract_addresses['ChainLink'], ChainLink.abi, _signer);
    contracts['OPUSD'] = new ethers.Contract(contract_addresses['OPUSD'], OPUSD.abi, _signer);    

    try {
      // var options = { gasLimit: 60000, gasPrice: ethers.utils.parseUnits('100', 'gwei') };
      const optionsCL = {}      
      const optionsSC = {}
      const transfer = contracts['ChainLink'].transfer( this.OracleAddress, this.crypto.EncodeTokenAmount(1, tokenDecimals, 0), optionsCL )                   
      const approve = contracts['OPUSD'].approve( this.OPEventAddress, this.crypto.EncodeTokenAmount(numTokensStakedToMint, tokenDecimals, 0), optionsSC )
      
      const waitForInteractions = Promise.all([transfer, approve])
            waitForInteractions.then( async (res) => {
              const transfer = await res[0].wait()
              const approve = await res[1].wait()    
              if(transfer.status == 1 && approve.status == 1) {         
                const abi = new ethers.utils.Interface( OPEvent.abi )
                const factory = new ethers.ContractFactory(abi, OPEvent.bytecode, _signer)
                console.log(`Deploying contract with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} || numTokensToMint: ${numTokensToMint} `)          
                // contracts['OPEvent'] = await factory.deploy(betPrice, Number(betSide), eventPeriod, numTokensToMint );          
                var contract = await factory.deploy(betPrice, Number(betSide), eventPeriod, numTokensToMint );          
                // The contract is not mined yet but check info
                console.log(contract.address, contract.deployTransaction);
                // You can wait for the contract to deploy... This will reject and error if the deployment
                // fails, for example, gas limit was too low, or the constructor called `revert`
                await contract.deployed();                
                resolve(true)
              }
            }).catch( err => 
              reject(
                `Error during contract deployment ${JSON.stringify(err)}`
              )  
            )        
    } catch (error) {
      console.log()
      reject(
        new Error(error)
      )   
    }     
   }) 
    
   
    
    
  }  
  
  
}
