pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract OPOption is ERC20, Ownable {

    using SafeERC20 for IERC20;

    constructor () public ERC20("ETHUSD IO", "EUIO") {}

    function mint(address beneficiary, uint tokensToMint) onlyOwner public {
      _mint(beneficiary, tokensToMint);
    }
    
    function safeTransfer(address to, uint tokensToTransfer) public {
      safeTransfer(to, tokensToTransfer);
    }
    
    function safeTransferFrom(address from, address to, uint tokensToTransfer) public {
      safeTransferFrom(from, to, tokensToTransfer);
    }
}
