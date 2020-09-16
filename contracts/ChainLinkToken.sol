pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ChainLinkToken is ERC20 {
  constructor () public ERC20("ChainLink Token", "LINK") {
    _mint(msg.sender, 1000000000 * (10 ** uint256(decimals())));
  }
}
