// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Factory.sol";
import "./Pair.sol";
import "./WTRBTC.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router {
    address public factory;
    address public wtrbtc;

    constructor(address _factory, address _wtrbtc) {
        factory = _factory;
        wtrbtc = _wtrbtc;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountA,
        uint amountB
    ) external {
        address pair = Factory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = Factory(factory).createPair(tokenA, tokenB);
        }
        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);
        Pair(pair).mint(msg.sender, amountA, amountB);
    }

    // add more functions as needed for swap, removeLiquidity, etc.
}
