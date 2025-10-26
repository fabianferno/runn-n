import React from 'react';
import { ConnectionStatus } from '@/components/nitrolite/ConnectionStatus';
import { BalanceStatus } from '@/components/nitrolite/BalanceStatus';
import { AppSessionStatus } from '@/components/nitrolite/AppSessionStatus';
import { MessageInterface } from '@/components/nitrolite/MessageInterface';

export default function NitroliteStatus() {
    return (
        <div className="space-y-4">
            <ConnectionStatus />
            <BalanceStatus />
            <AppSessionStatus />
         {/*   <MessageInterface /> */}
        </div>
    );
}