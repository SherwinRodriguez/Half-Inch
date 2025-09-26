// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Provider {
    mapping (address => mapping (address => uint256)) public liquidityPools;

    function createLiquidityPool(address tokenA, address tokenB) public {
        require(tokenA != address(0) && tokenB != address(0), "tokens cannot be zero address");
        require(tokenA != tokenB, "tokens cannot be the same address");
        liquidityPools[tokenA][tokenB] = 0;
        liquidityPools[tokenB][tokenA] = 0;
    }

    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) public {
        require(tokenA != address(0) && tokenB != address(0), "tokens cannot be zero address");
        require(tokenA != tokenB, "tokens cannot be the same address");
        require(liquidityPools[tokenA][tokenB] != 0, "liquidity pool does not exist");
        require(amountA > 0 && amountB > 0, "amounts cannot be zero");
        liquidityPools[tokenA][tokenB] += amountA;
        liquidityPools[tokenB][tokenA] += amountB;
    }
}
