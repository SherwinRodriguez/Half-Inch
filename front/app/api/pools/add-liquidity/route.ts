import { NextRequest, NextResponse } from 'next/server';
import { ContractService, DEFAULT_ADDRESSES } from '@/lib/contracts';
import database from '@/lib/database';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolAddress, amountA, amountB, privateKey, rpcUrl, useWalletSigning, walletAddress } = body;
    
    console.log('\n📝 ADD LIQUIDITY REQUEST DEBUG');
    console.log('='.repeat(40));
    console.log('Body keys:', Object.keys(body));
    console.log('Private Key provided:', !!privateKey);
    console.log('Use Wallet Signing:', useWalletSigning);
    console.log('Wallet Address:', walletAddress);
    
    // Check authentication method
    if (!privateKey && !walletAddress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Either private key or wallet address is required for adding liquidity',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    if (useWalletSigning && !walletAddress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Wallet address required when using wallet signing',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    if (!useWalletSigning && !privateKey) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Private key required when not using wallet signing',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!poolAddress || !amountA || !amountB) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Pool address, amountA, and amountB are required',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    // For now, we only support private key signing
    if (useWalletSigning) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Wallet signing not yet implemented. Please use private key for now.',
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 400 });
    }

    console.log('\n💧 ADDING LIQUIDITY TO POOL');
    console.log('='.repeat(40));
    console.log('Pool Address:', poolAddress);
    console.log('Amount A:', amountA);
    console.log('Amount B:', amountB);
    
    // Initialize contract service
    const contractService = new ContractService(rpcUrl || undefined, privateKey);
    
    // First, verify the pool exists and get comprehensive info
    let poolExists = false;
    let factoryExists = false;
    let routerExists = false;
    
    try {
      const provider = contractService.getProvider();
      
      // Check if contracts exist
      const factoryAddress = process.env.FACTORY_ADDRESS || DEFAULT_ADDRESSES.factory;
      const routerAddress = process.env.ROUTER_ADDRESS || DEFAULT_ADDRESSES.router;
      
      const [poolCode, factoryCode, routerCode] = await Promise.all([
        provider.getCode(poolAddress.toLowerCase()),
        provider.getCode(factoryAddress),
        provider.getCode(routerAddress)
      ]);
      
      poolExists = poolCode !== '0x';
      factoryExists = factoryCode !== '0x';
      routerExists = routerCode !== '0x';
      
      console.log('📋 CONTRACT STATUS CHECK');
      console.log('Pool exists:', poolExists);
      console.log('Factory exists:', factoryExists);
      console.log('Router exists:', routerExists);
      
      if (!factoryExists) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Factory contract not deployed. Please deploy the Factory contract first.',
          timestamp: Date.now()
        };
        return NextResponse.json(response, { status: 400 });
      }
      
      if (!routerExists) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Router contract not deployed. Please deploy the Router contract first.',
          timestamp: Date.now()
        };
        return NextResponse.json(response, { status: 400 });
      }
      
      if (!poolExists) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Pool contract does not exist at the specified address. Please create the pool first using /api/pools/create.',
          timestamp: Date.now()
        };
        return NextResponse.json(response, { status: 400 });
      }
      
    } catch (codeError) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to verify contracts: ${codeError.message}`,
        timestamp: Date.now()
      };
      return NextResponse.json(response, { status: 500 });
    }
    
    // Get pool contract and token addresses
    // Normalize address for contract calls to avoid checksum errors
    const normalizedPoolAddress = poolAddress.toLowerCase();
    const pairContract = await contractService.getPairContract(normalizedPoolAddress);
    const [token0Address, token1Address] = await Promise.all([
      pairContract.token0(),
      pairContract.token1()
    ]);
    
    console.log('Token0:', token0Address);
    console.log('Token1:', token1Address);
    
    // Get Router contract for adding liquidity
    const routerContract = await contractService.getRouterContract();
    
    // Get token contracts for approvals
    // Normalize token addresses for contract calls
    const normalizedToken0 = token0Address.toLowerCase();
    const normalizedToken1 = token1Address.toLowerCase();
    
    const token0Contract = await contractService.getERC20Contract(normalizedToken0);
    const token1Contract = await contractService.getERC20Contract(normalizedToken1);
    
    try {
      console.log('\n🔄 Step 1: Approving tokens...');
      
      // Approve tokens for Router contract
      const routerAddress = process.env.ROUTER_ADDRESS || DEFAULT_ADDRESSES.router;
      
      const approvalTx0 = await token0Contract.approve(routerAddress, amountA);
      console.log(`Token0 approval tx: ${approvalTx0.hash}`);
      await approvalTx0.wait();
      
      const approvalTx1 = await token1Contract.approve(routerAddress, amountB);
      console.log(`Token1 approval tx: ${approvalTx1.hash}`);
      await approvalTx1.wait();
      
      console.log('✅ Token approvals confirmed');
      
      console.log('\n🔄 Step 2: Adding liquidity...');
      
      // Add liquidity through Router (simplified version - no slippage protection or deadline)
      const addLiquidityTx = await contractService.retryWithDifferentRpc(async () => {
        // Normalize token addresses for contract calls
        const normalizedToken0 = token0Address.toLowerCase();
        const normalizedToken1 = token1Address.toLowerCase();
        
        return await routerContract.addLiquidity(
          normalizedToken0,
          normalizedToken1,
          amountA,
          amountB
        );
      });
      
      console.log(`Add liquidity transaction submitted: ${addLiquidityTx.hash}`);
      
      // Wait for confirmation
      const receipt = await addLiquidityTx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Liquidity added successfully!');
        
        // Get updated pool information
        const [reserve0, reserve1, totalSupply] = await Promise.all([
          pairContract.reserve0(),
          pairContract.reserve1(),
          pairContract.totalSupply()
        ]);
        
        // Get token symbols
        const [token0Symbol, token1Symbol] = await Promise.all([
          token0Contract.symbol().catch(() => 'Unknown'),
          token1Contract.symbol().catch(() => 'Unknown')
        ]);
        
        // Update pool in database
        const existingPool = database.getPool(poolAddress);
        if (existingPool) {
          database.updatePool(poolAddress, {
            reserveA: reserve0.toString(),
            reserveB: reserve1.toString(),
            totalSupply: totalSupply.toString(),
            tvl: calculateTVL(reserve0.toString(), reserve1.toString())
          });
        }
        
        // Parse events to get liquidity amount minted
        let liquidityMinted = '0';
        for (const log of receipt.logs) {
          try {
            const decoded = pairContract.interface.parseLog(log);
            if (decoded?.name === 'Mint') {
              liquidityMinted = decoded.args?.amount || '0';
              break;
            }
          } catch {
            continue;
          }
        }
        
        const response: ApiResponse<{
          txHash: string;
          poolAddress: string;
          amountA: string;
          amountB: string;
          liquidityMinted: string;
          token0Symbol: string;
          token1Symbol: string;
          newReserve0: string;
          newReserve1: string;
          newTotalSupply: string;
        }> = {
          success: true,
          data: {
            txHash: addLiquidityTx.hash,
            poolAddress: poolAddress,
            amountA,
            amountB,
            liquidityMinted,
            token0Symbol,
            token1Symbol,
            newReserve0: reserve0.toString(),
            newReserve1: reserve1.toString(),
            newTotalSupply: totalSupply.toString()
          },
          timestamp: Date.now()
        };
        
        return NextResponse.json(response);
        
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (contractError: any) {
      console.error('Contract execution error:', contractError);
      
      let errorMessage = 'Adding liquidity failed';
      let statusCode = 400;
      
      // Handle specific error types
      if (contractError.code === 'CALL_EXCEPTION') {
        if (contractError.message?.includes('timeout') || contractError.message?.includes('Request timeout')) {
          errorMessage = 'Network timeout - please try again. The RPC provider may be overloaded.';
          statusCode = 503;
        } else if (contractError.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas or token amounts';
        } else if (contractError.message?.includes('execution reverted')) {
          if (contractError.reason === 'require(false)' || contractError.data === '0x') {
            errorMessage = 'Router contract execution failed. Possible causes: 1) Pool does not exist (create pool first), 2) Insufficient token balance, 3) Missing token approvals, 4) Factory contract not deployed';
          } else {
            errorMessage = `Contract execution reverted: ${contractError.reason || 'Unknown reason'}`;
          }
        } else if (contractError.message?.includes('INSUFFICIENT_A_AMOUNT')) {
          errorMessage = 'Insufficient amount A - slippage too high';
        } else if (contractError.message?.includes('INSUFFICIENT_B_AMOUNT')) {
          errorMessage = 'Insufficient amount B - slippage too high';
        } else if (contractError.message?.includes('EXPIRED')) {
          errorMessage = 'Transaction expired - please try again';
        }
      }
      
      const response: ApiResponse<null> = {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
      
      return NextResponse.json(response, { status: statusCode });
    }
    
  } catch (error) {
    console.error('Add liquidity error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now()
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

// Helper function to calculate TVL (you may want to move this to utils)
function calculateTVL(reserve0: string, reserve1: string): number {
  // Simple TVL calculation - in a real app you'd use token prices
  // For now, just return the sum assuming both tokens have similar value
  const r0 = parseFloat(reserve0) / 1e18;
  const r1 = parseFloat(reserve1) / 1e18;
  return (r0 + r1) * 100; // Placeholder calculation
}
