pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract StableCoin is ERC20 {

  constructor () public ERC20("Stablecoin Token", "SCT") {
    _mint(msg.sender, 10000000 * (10 ** uint256(decimals())));
  }
}
