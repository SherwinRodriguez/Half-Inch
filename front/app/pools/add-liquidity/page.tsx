'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AddLiquidityParams {
  poolAddress: string;
  amountA: string;
  amountB: string;
}

export default function AddLiquidityPage() {
  const [poolAddress, setPoolAddress] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [usePrivateKey, setUsePrivateKey] = useState(true);

  const addLiquidityMutation = useMutation({
    mutationFn: async (data: AddLiquidityParams) => {
      if (!privateKey) {
        throw new Error('Please provide a private key');
      }

      const response = await fetch('/api/pools/add-liquidity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          privateKey,
          useWalletSigning: false
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add liquidity');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Liquidity added successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Add liquidity failed:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poolAddress || !amountA || !amountB) {
      alert('Please fill in all fields');
      return;
    }

    addLiquidityMutation.mutate({
      poolAddress,
      amountA,
      amountB
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/pools">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Add Liquidity</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Liquidity to Pool
            </CardTitle>
            <CardDescription>
              Add liquidity to an existing pool to earn trading fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pool Address */}
              <div className="space-y-2">
                <Label htmlFor="poolAddress">Pool Address</Label>
                <Input
                  id="poolAddress"
                  type="text"
                  placeholder="0x..."
                  value={poolAddress}
                  onChange={(e) => setPoolAddress(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Token Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountA">Token A Amount</Label>
                  <Input
                    id="amountA"
                    type="text"
                    placeholder="1000000000000000000"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Amount in wei (18 decimals)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountB">Token B Amount</Label>
                  <Input
                    id="amountB"
                    type="text"
                    placeholder="2000000000000000000"
                    value={amountB}
                    onChange={(e) => setAmountB(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Amount in wei (18 decimals)
                  </p>
                </div>
              </div>

              {/* Private Key */}
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Required for transaction signing
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={addLiquidityMutation.isPending}
              >
                {addLiquidityMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Liquidity...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Liquidity
                  </>
                )}
              </Button>
            </form>

            {/* Error Display */}
            {addLiquidityMutation.isError && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>
                  {addLiquidityMutation.error?.message || 'Failed to add liquidity'}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {addLiquidityMutation.isSuccess && (
              <Alert className="mt-4">
                <AlertDescription>
                  ✅ Liquidity added successfully! 
                  Transaction: {addLiquidityMutation.data?.data?.txHash}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Make sure the pool exists before adding liquidity
            </p>
            <p className="text-sm text-muted-foreground">
              • Token amounts should be in wei (multiply by 10^18)
            </p>
            <p className="text-sm text-muted-foreground">
              • You need sufficient token balances and gas
            </p>
            <p className="text-sm text-muted-foreground">
              • Tokens must be approved for the Router contract
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
