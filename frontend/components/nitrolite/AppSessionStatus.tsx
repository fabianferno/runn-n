import React from 'react';
import { useNitroliteAppSession } from '@/hooks/useNitrolite';

export const AppSessionStatus: React.FC = () => {
    const {
        appSessionId,
        isAppSessionCreated,
        isCreatingAppSession,
        createAppSession
    } = useNitroliteAppSession();


    const handleCreateSession = async () => {
        await createAppSession();
    };

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span
                    className={`h-3 w-3 rounded-full ${isAppSessionCreated ? 'bg-green-400' :
                        isCreatingAppSession ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}
                />
                <span>
                    App Session: {isAppSessionCreated ? 'Created' :
                        isCreatingAppSession ? 'Creating...' : 'Not Created'}
                </span>
            </div>

            {isAppSessionCreated && appSessionId && (
                <div className="text-sm text-gray-600">
                    ID: {appSessionId.slice(0, 8)}...
                </div>
            )}

            {!isAppSessionCreated && !isCreatingAppSession && (
                <button
                    onClick={handleCreateSession}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                    Create Session
                </button>
            )}
        </div>
    );
};