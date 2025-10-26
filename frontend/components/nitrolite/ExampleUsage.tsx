import React from 'react';
import {
    useNitroliteWebSocket,
    useNitroliteAuth,
    useNitroliteBalances,
    useNitroliteAppSession,
    useNitroliteMessages
} from '@/hooks/useNitrolite';

/**
 * Example component demonstrating how to use the Nitrolite hooks
 * This shows how to access different pieces of state from any component
 */
export const ExampleUsage: React.FC = () => {
    // WebSocket status
    const { wsStatus } = useNitroliteWebSocket();

    // Authentication status
    const { isNitroliteAuthenticated, sessionKey } = useNitroliteAuth();

    // Balance information
    const { balances, isLoadingBalances, fetchBalances } = useNitroliteBalances();

    // App session management
    const {
        appSessionId,
        isAppSessionCreated,
        isCreatingAppSession,
        createAppSession
    } = useNitroliteAppSession();

    // Messaging functionality
    const { messages, isSendingMessage, sendMessage } = useNitroliteMessages();

    const handleCreateSession = async () => {
        // Example: Create session with a partner
        const partnerAddress = '0x1234567890123456789012345678901234567890';
        await createAppSession(partnerAddress);
    };

    const handleSendTestMessage = async () => {
        // Example: Send a test message
        const testMessage = {
            type: 'test',
            content: 'Hello from the app!',
            timestamp: Date.now()
        };
        await sendMessage(JSON.stringify(testMessage));
    };

    const handleSendCoordinates = async () => {
        // Example: Send coordinates
        const coordsMessage = {
            type: 'coordinates',
            lat: 40.7128,
            lng: -74.0060,
            timestamp: Date.now()
        };
        await sendMessage(JSON.stringify(coordsMessage));
    };

    return (
        <div className="p-4 space-y-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Nitrolite Hook Examples</h3>

            {/* WebSocket Status */}
            <div>
                <h4 className="font-medium">WebSocket Status:</h4>
                <p>Status: {wsStatus}</p>
            </div>

            {/* Authentication Status */}
            <div>
                <h4 className="font-medium">Authentication:</h4>
                <p>Authenticated: {isNitroliteAuthenticated ? 'Yes' : 'No'}</p>
                <p>Session Key: {sessionKey ? `${sessionKey.address.slice(0, 8)}...` : 'None'}</p>
            </div>

            {/* Balances */}
            <div>
                <h4 className="font-medium">Balances:</h4>
                <p>Loading: {isLoadingBalances ? 'Yes' : 'No'}</p>
                <p>USDC Balance: {balances?.['usdc'] || balances?.['USDC'] || 'N/A'}</p>
                <button
                    onClick={fetchBalances}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                    Refresh Balances
                </button>
            </div>

            {/* App Session */}
            <div>
                <h4 className="font-medium">App Session:</h4>
                <p>Created: {isAppSessionCreated ? 'Yes' : 'No'}</p>
                <p>Creating: {isCreatingAppSession ? 'Yes' : 'No'}</p>
                <p>Session ID: {appSessionId ? `${appSessionId.slice(0, 8)}...` : 'None'}</p>
                <button
                    onClick={handleCreateSession}
                    disabled={isCreatingAppSession}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                >
                    Create Test Session
                </button>
            </div>

            {/* Messages */}
            <div>
                <h4 className="font-medium">Messages:</h4>
                <p>Sending: {isSendingMessage ? 'Yes' : 'No'}</p>
                <p>Message Count: {messages.length}</p>
                <div className="space-x-2">
                    <button
                        onClick={handleSendTestMessage}
                        disabled={!isAppSessionCreated || isSendingMessage}
                        className="px-3 py-1 bg-purple-500 text-white rounded text-sm disabled:opacity-50"
                    >
                        Send Test Message
                    </button>
                    <button
                        onClick={handleSendCoordinates}
                        disabled={!isAppSessionCreated || isSendingMessage}
                        className="px-3 py-1 bg-orange-500 text-white rounded text-sm disabled:opacity-50"
                    >
                        Send Coordinates
                    </button>
                </div>
            </div>

            {/* Recent Messages */}
            {messages.length > 0 && (
                <div>
                    <h4 className="font-medium">Recent Messages:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {messages.slice(-3).map((message, index) => (
                            <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                                <div>Type: {message.type}</div>
                                {message.content && <div>Content: {message.content}</div>}
                                {message.lat && message.lng && (
                                    <div>Coords: {message.lat}, {message.lng}</div>
                                )}
                                <div className="text-xs text-gray-500">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
