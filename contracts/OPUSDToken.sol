pragma solidity 0.6.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract OPUSDToken is ERC20 {
    uint8 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(DECIMALS));

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor () public ERC20("OpenPredict USD Token", "OPUSD") {
        mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 value) public returns (bool) {
        require(value <= 10000000 ether, "dont be greedy");
        _mint(to, value);
        return true;
    }

}