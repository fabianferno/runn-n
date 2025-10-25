import { webSocketService, type WsStatus } from '@/lib/websocket';
import { useState, useEffect } from 'react';
import {
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createEIP712AuthMessageSigner,
    parseAnyRPCResponse,
    RPCMethod,
    type AuthChallengeResponse,
    type AuthRequestParams,
} from '@erc7824/nitrolite';
// CHAPTER 3: Authentication utilities
import {
    generateSessionKey,
    getStoredSessionKey,
    storeSessionKey,
    removeSessionKey,
    storeJWT,
    removeJWT,
    type SessionKey,
} from '@/lib/nitrolite-utils';
import { useAccount, useWalletClient } from 'wagmi';


// CHAPTER 3: EIP-712 domain for authentication
const getAuthDomain = () => ({
    name: 'run-n',
});

// CHAPTER 3: Authentication constants
const AUTH_SCOPE = 'run-n.app';
const APP_NAME = 'run-n';
const SESSION_DURATION = 3600; // 1 hour



export default function ConnectionStatus() {
    const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isNitroliteAuthenticated, setIsNitroliteAuthenticated] = useState(false);
    const [isNitroliteAuthAttempted, setIsNitroliteAuthAttempted] = useState(false);
    const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('');
    const { address: account } = useAccount();
    const { data: walletClient } = useWalletClient();


    // This effect runs once on mount to handle the WebSocket connection
    useEffect(() => {
        // Get or generate session key on startup (IMPORTANT: Store in localStorage)
        const existingSessionKey = getStoredSessionKey();
        if (existingSessionKey) {
            setSessionKey(existingSessionKey);
        } else {
            const newSessionKey = generateSessionKey();
            storeSessionKey(newSessionKey);
            setSessionKey(newSessionKey);
        }


        // Subscribe to status updates from our service
        webSocketService.addStatusListener(setWsStatus);
        // Tell the service to connect
        webSocketService.connect();

        // On cleanup, remove the listener
        return () => {
            webSocketService.removeStatusListener(setWsStatus);
        };
    }, []);

    useEffect(() => {
        if (account && sessionKey && wsStatus === 'Connected' && !isNitroliteAuthenticated && !isNitroliteAuthAttempted) {
            setIsNitroliteAuthAttempted(true);

            // Generate fresh timestamp for this auth attempt
            const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION);
            setSessionExpireTimestamp(expireTimestamp);

            const authParams: AuthRequestParams = {
                address: account,
                session_key: sessionKey.address,
                app_name: APP_NAME,
                expire: expireTimestamp,
                scope: AUTH_SCOPE,
                application: account,
                allowances: [],
            };

            createAuthRequestMessage(authParams).then((payload) => {
                webSocketService.send(payload);
            });
        }
    }, [account, sessionKey, wsStatus, isNitroliteAuthenticated, isNitroliteAuthAttempted]);

    // CHAPTER 3: Handle server messages for authentication
    useEffect(() => {
        const handleMessage = async (data: unknown) => {
            const response = parseAnyRPCResponse(JSON.stringify(data));

            // Handle auth challenge
            if (
                response.method === RPCMethod.AuthChallenge &&
                walletClient &&
                sessionKey &&
                account &&
                sessionExpireTimestamp
            ) {
                const challengeResponse = response as AuthChallengeResponse;

                const authParams = {
                    scope: AUTH_SCOPE,
                    application: walletClient.account?.address as `0x${string}`,
                    participant: sessionKey.address as `0x${string}`,
                    expire: sessionExpireTimestamp,
                    allowances: [],
                };

                const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain());

                try {
                    const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse);
                    webSocketService.send(authVerifyPayload);
                } catch (error) {
                    alert('Signature rejected. Please try again.');
                    setIsNitroliteAuthAttempted(false);
                }
            }

            // Handle auth success
            if (response.method === RPCMethod.AuthVerify && response.params?.success) {
                setIsNitroliteAuthenticated(true);
                if (response.params.jwtToken) storeJWT(response.params.jwtToken);
            }

            // Handle errors
            if (response.method === RPCMethod.Error) {
                removeJWT();
                // Clear session key on auth failure to regenerate next time
                removeSessionKey();
                alert(`Authentication failed: ${response.params.error} --`);
                setIsNitroliteAuthAttempted(false);
            }
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, [walletClient, sessionKey, sessionExpireTimestamp, account]);

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span>WS: {wsStatus}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isNitroliteAuthenticated ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                <span>
                    Auth: {isNitroliteAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
            </div>
        </div>
    );
}