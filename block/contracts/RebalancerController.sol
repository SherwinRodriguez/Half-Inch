// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Pair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RebalancerController {
    address public keeper;
    uint256 public maxSlippage;
    uint256 public maxGasPrice;
    uint256 public cooldown;
    mapping(address => uint256) public lastRebalance;

    modifier onlyKeeper() {
        require(msg.sender == keeper, "Not keeper");
        _;
    }

    constructor(address _keeper, uint256 _maxSlippage, uint256 _maxGasPrice, uint256 _cooldown) {
        keeper = _keeper;
        maxSlippage = _maxSlippage;
        maxGasPrice = _maxGasPrice;
        cooldown = _cooldown;
    }

    function rebalance(address pair, uint256 targetRatioBps) external onlyKeeper {
        require(block.timestamp > lastRebalance[pair] + cooldown, "Cooldown");
        address token0 = Pair(pair).token0();
        address token1 = Pair(pair).token1();
        uint256 reserve0 = IERC20(token0).balanceOf(pair);
        uint256 reserve1 = IERC20(token1).balanceOf(pair);
        uint256 ratioBps = (reserve0 * 10000) / reserve1;
        if (ratioBps > targetRatioBps) {
            // sell token0 for token1
            uint256 amount0Out = (ratioBps - targetRatioBps) * reserve0 / 10000;
            uint256 amount1In = (amount0Out * reserve1) / reserve0;
            _swap(pair, amount0Out, amount1In, token0, token1);
        } else if (ratioBps < targetRatioBps) {
            // sell token1 for token0
            uint256 amount1Out = (targetRatioBps - ratioBps) * reserve1 / 10000;
            uint256 amount0In = (amount1Out * reserve0) / reserve1;
            _swap(pair, amount1Out, amount0In, token1, token0);
        }
        lastRebalance[pair] = block.timestamp;
    }

    function _swap(address pair, uint256 amountOut, uint256 /* amountIn */, address tokenOut, address /* tokenIn */) internal {
        // Determine which token is token0 and token1 in the pair
        address token0 = Pair(pair).token0();
        
        uint256 amount0Out = 0;
        uint256 amount1Out = 0;
        
        if (tokenOut == token0) {
            amount0Out = amountOut;
        } else {
            amount1Out = amountOut;
        }
        
        Pair(pair).swap(amount0Out, amount1Out, address(this));
    }

    // add more governance functions as needed
}
