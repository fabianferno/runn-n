import React from 'react';
import { useNitroliteBalances } from '@/hooks/useNitrolite';
import { BalanceDisplay } from '@/components/nitrolite/BalanceDisplay';

export const BalanceStatus: React.FC = () => {
    const { balances, isLoadingBalances } = useNitroliteBalances();

    return (
        <div className="flex items-center gap-2">
            <BalanceDisplay
                balance={
                    isLoadingBalances ? 'Loading...' : (balances?.['usdc'] ?? balances?.['USDC'] ?? null)
                }
                symbol="USDC"
            />
        </div>
    );
};
