import React from 'react';
import { useNitroliteWebSocket, useNitroliteAuth } from '@/hooks/useNitrolite';

export const ConnectionStatus: React.FC = () => {
    const { wsStatus } = useNitroliteWebSocket();
    const { isNitroliteAuthenticated } = useNitroliteAuth();

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span
                    className={`h-3 w-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-400' : 'bg-red-400'
                        }`}
                />
                <span>WS: {wsStatus}</span>
            </div>

            <div className="flex items-center gap-2">
                <span
                    className={`h-3 w-3 rounded-full ${isNitroliteAuthenticated ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                />
                <span>
                    Auth: {isNitroliteAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
            </div>
        </div>
    );
};