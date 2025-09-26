// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Pair is ERC20 {
    address public token0;
    address public token1;
    uint112 public reserve0;
    uint112 public reserve1;

    constructor() ERC20("LP Token", "LPT") {}

    function initialize(address _token0, address _token1) external {
        require(token0 == address(0) && token1 == address(0), "Pair: ALREADY_INITIALIZED");
        token0 = _token0;
        token1 = _token1;
    }

    function mint(address to, uint amount0, uint amount1) external returns (uint liquidity) {
        // Simplified for brevity: Add liquidity logic, mint LP tokens
        reserve0 += uint112(amount0);
        reserve1 += uint112(amount1);
        liquidity = amount0 + amount1; // Not actual Uniswap math
        _mint(to, liquidity);
    }

    function burn(address to) external returns (uint amount0, uint amount1) {
        // Simplified for brevity: Remove liquidity logic, burn LP tokens
        amount0 = reserve0 / 2;
        amount1 = reserve1 / 2;
        reserve0 -= uint112(amount0);
        reserve1 -= uint112(amount1);
        _burn(msg.sender, amount0 + amount1);
        IERC20(token0).transfer(to, amount0);
        IERC20(token1).transfer(to, amount1);
    }

    function swap(uint amount0Out, uint amount1Out, address to) external {
        require(amount0Out > 0 || amount1Out > 0, "Pair: INSUFFICIENT_OUTPUT_AMOUNT");
        require(amount0Out < reserve0 && amount1Out < reserve1, "Pair: INSUFFICIENT_LIQUIDITY");
        if (amount0Out > 0) IERC20(token0).transfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).transfer(to, amount1Out);
        // Reserves update omitted for brevity
    }
}
