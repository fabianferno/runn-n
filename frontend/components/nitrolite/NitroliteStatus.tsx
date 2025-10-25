import { webSocketService, type WsStatus } from '@/lib/websocket';
import { useState, useEffect } from 'react';
import {
    BalanceUpdateResponse,
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createECDSAMessageSigner,
    createEIP712AuthMessageSigner,
    createGetLedgerBalancesMessage,
    GetLedgerBalancesResponse,
    createSubmitAppStateMessage,
    parseAnyRPCResponse,
    RPCMethod,
    TransferResponse,
    type AuthChallengeResponse,
    type AuthRequestParams,
    createAppSessionMessage,
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
import { BalanceDisplay } from '@/components/nitrolite/BalanceDisplay';
import { useTransfer } from '@/components/nitrolite/hooks/useTransfer';



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
    // FINAL: Add transfer state after existing state
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferStatus, setTransferStatus] = useState<string | null>(null);
    const { handleTransfer: transferFn } = useTransfer(sessionKey, isNitroliteAuthenticated);

    const { address: account } = useAccount();
    const { data: walletClient } = useWalletClient();

    // CHAPTER 4: Add balance state to store fetched balances
    const [balances, setBalances] = useState<Record<string, string> | null>(null);
    // CHAPTER 4: Add loading state for better user experience
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);


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

            // CHAPTER 4: Handle balance responses (when we asked for balances)
            if (response.method === RPCMethod.GetLedgerBalances) {
                const balanceResponse = response as GetLedgerBalancesResponse;
                const balances = balanceResponse.params.ledgerBalances;

                console.log('Received balance response:', balances);

                // Check if we actually got balance data back
                if (balances && balances.length > 0) {
                    // CHAPTER 4: Transform the data for easier use in our UI
                    // Convert from: [{asset: "usdc", amount: "100"}, {asset: "eth", amount: "0.5"}]
                    // To: {"usdc": "100", "eth": "0.5"}
                    const balancesMap = Object.fromEntries(
                        balances.map((balance) => [balance.asset, balance.amount]),
                    );
                    console.log('Setting balances:', balancesMap);
                    setBalances(balancesMap);
                } else {
                    console.log('No balance data received - wallet appears empty');
                    setBalances({});
                }
                // CHAPTER 4: Stop loading once we receive any balance response
                setIsLoadingBalances(false);
            }

            // CHAPTER 4: Handle live balance updates (server pushes these automatically)
            if (response.method === RPCMethod.BalanceUpdate) {
                const balanceUpdate = response as BalanceUpdateResponse;
                const balances = balanceUpdate.params.balanceUpdates;

                console.log('Live balance update received:', balances);

                // Same data transformation as above
                const balancesMap = Object.fromEntries(
                    balances.map((balance) => [balance.asset, balance.amount]),
                );
                console.log('Updating balances in real-time:', balancesMap);
                setBalances(balancesMap);
            }

            if (response.method === RPCMethod.Transfer) {
                const transferResponse = response as TransferResponse;
                console.log('Transfer completed:', transferResponse.params);

                setIsTransferring(false);
                setTransferStatus(null);

                alert(`Transfer completed successfully!`);
            }




            // Handle errors
            if (response.method === RPCMethod.Error) {
                console.error('RPC Error:', response.params);

                if (isTransferring) {
                    setIsTransferring(false);
                    setTransferStatus(null);
                    alert(`Transfer failed: ${response.params.error}`);
                } else {
                    // Other errors (like auth failures)
                    removeJWT();
                    removeSessionKey();
                    alert(`Error: ${response.params.error}`);
                    setIsNitroliteAuthAttempted(false);
                }
            }
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, [walletClient, sessionKey, sessionExpireTimestamp, account]);

    // CHAPTER 4: Automatically fetch balances when user is authenticated
    // This useEffect hook runs whenever authentication status, sessionKey, or account changes
    useEffect(() => {
        // Only proceed if all required conditions are met:
        // 1. User has completed authentication
        // 2. We have a session key (temporary private key for signing)
        // 3. We have the user's wallet address
        if (isNitroliteAuthenticated && sessionKey && account) {
            console.log('Authenticated! Fetching ledger balances...');

            // CHAPTER 4: Show loading state while we fetch balances
            setIsLoadingBalances(true);

            // CHAPTER 4: Create a "signer" - this is what signs our requests without user popups
            // Think of this like a temporary stamp that proves we're allowed to make requests
            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

            // CHAPTER 4: Create a signed request to get the user's asset balances
            // This is like asking "What's in my wallet?" but with cryptographic proof
            createGetLedgerBalancesMessage(sessionSigner, account)
                .then((getBalancesPayload) => {
                    // Send the signed request through our WebSocket connection
                    console.log('Sending balance request...', getBalancesPayload);
                    webSocketService.send(getBalancesPayload);
                })
                .catch((error) => {
                    console.error('Failed to create balance request:', error);
                    setIsLoadingBalances(false); // Stop loading on error
                    // In a real app, you might show a user-friendly error message here
                });
        }
    }, [isNitroliteAuthenticated, sessionKey, account]);

    useEffect(() => {
        // Only proceed if all required conditions are met:
        // 1. User has completed authentication
        // 2. We have a session key (temporary private key for signing)
        // 3. We have the user's wallet address
        if (isNitroliteAuthenticated && sessionKey && account) {
            console.log('Authenticated! Fetching ledger balances...');

            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);


        }
    }, [isNitroliteAuthenticated, sessionKey, account]);

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span>WS: {wsStatus}</span>
            </div>
            {/* CHAPTER 4: Display balance when authenticated */}

            <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isNitroliteAuthenticated ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                <span>
                    Auth: {isNitroliteAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
            </div>
            {isNitroliteAuthenticated && (
                <BalanceDisplay
                    balance={
                        isLoadingBalances ? 'Loading...' : (balances?.['usdc'] ?? balances?.['USDC'] ?? null)
                    }
                    symbol="USDC"
                />
            )}
        </div>
    );
}