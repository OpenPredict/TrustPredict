pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract OPOption is ERC20, Ownable {

    using SafeERC20 for IERC20;

    constructor (string memory name, string memory symbol) public ERC20(name, symbol) {}

    function mint(address beneficiary, uint tokensToMint) onlyOwner public {
      _mint(beneficiary, tokensToMint);
    }
}
