'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { webSocketService, type WsStatus } from '@/lib/websocket';
import {
    BalanceUpdateResponse,
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createECDSAMessageSigner,
    createEIP712AuthMessageSigner,
    createGetLedgerBalancesMessage,
    GetLedgerBalancesResponse,
    createAppSessionMessage,
    createApplicationMessage,
    parseAnyRPCResponse,
    RPCMethod,
    TransferResponse,
    type AuthChallengeResponse,
    type AuthRequestParams,
    type CreateAppSessionResponse,
    type SubmitAppStateResponse,
    type RPCAppDefinition,
    type RPCAppSessionAllocation,
    type RPCProtocolVersion,
    createSubmitAppStateMessage,
    RPCAppStateIntent,
    TransferRequestParams,
} from '@erc7824/nitrolite';
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


// EIP-712 domain for authentication
const getAuthDomain = () => ({
    name: 'run-n',
});

// Authentication constants
const AUTH_SCOPE = 'run-n.app';
const APP_NAME = 'run-n';
const SESSION_DURATION = 3600; // 1 hour

// App session constants
// @ts-expect-error - RPCProtocolVersion is not defined
const APP_PROTOCOL: RPCProtocolVersion = "NitroRPC/0.4";
const serverWalletAddress = process.env.NEXT_PUBLIC_SERVER_WALLET || '';
const DEFAULT_WEIGHTS = [100, 0];
const DEFAULT_QUORUM = 100;

// Validate server wallet address
if (!process.env.NEXT_PUBLIC_SERVER_WALLET) {
    console.warn('⚠️ NEXT_PUBLIC_SERVER_WALLET not set, using zero address as fallback');
}
interface NitroliteContextType {
    // WebSocket state
    wsStatus: WsStatus;

    // Authentication state
    sessionKey: SessionKey | null;
    isNitroliteAuthenticated: boolean;
    isNitroliteAuthAttempted: boolean;
    sessionExpireTimestamp: string;

    // Balance state
    balances: Record<string, string> | null;
    isLoadingBalances: boolean;

    // Transfer state
    isTransferring: boolean;
    transferStatus: string | null;

    // App session state
    appSessionId: string | null;
    isAppSessionCreated: boolean;
    isCreatingAppSession: boolean;

    // Message state
    messages: unknown[];
    isSendingMessage: boolean;

    // Coordinates state
    isSendingCoordinates: boolean;

    // Actions
    createAppSession: () => Promise<void>;
    sendMessage: (messageBody: string) => Promise<void>;
    sendCoordinates: (x: number, y: number, payload: unknown) => Promise<void>;
    fetchBalances: () => Promise<void>;
    handleTransfer: (params: TransferRequestParams) => Promise<void>;
    resetAppStateVersion: () => void;
}

const NitroliteContext = createContext<NitroliteContextType | undefined>(undefined);

export const useNitrolite = () => {
    const context = useContext(NitroliteContext);
    if (context === undefined) {
        throw new Error('useNitrolite must be used within a NitroliteProvider');
    }
    return context;
};

interface NitroliteProviderProps {
    children: ReactNode;
}

export const NitroliteProvider: React.FC<NitroliteProviderProps> = ({ children }) => {
    // WebSocket state
    const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');

    // Authentication state
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isNitroliteAuthenticated, setIsNitroliteAuthenticated] = useState(false);
    const [isNitroliteAuthAttempted, setIsNitroliteAuthAttempted] = useState(false);
    const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('');

    // Balance state
    const [balances, setBalances] = useState<Record<string, string> | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    // Transfer state
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferStatus, setTransferStatus] = useState<string | null>(null);

    // App session state
    const [appSessionId, setAppSessionId] = useState<string | null>(null);
    const [isAppSessionCreated, setIsAppSessionCreated] = useState(false);
    const [isCreatingAppSession, setIsCreatingAppSession] = useState(false);
    const appStateVersionRef = useRef<number>(2);

    // Message state
    const [messages, setMessages] = useState<unknown[]>([]);    
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Coordinates state
    const [isSendingCoordinates, setIsSendingCoordinates] = useState(false);

    // Store pending auth challenge for when walletClient becomes available
    const [pendingAuthChallenge, setPendingAuthChallenge] = useState<AuthChallengeResponse | null>(null);

    // Set up coordinates handler
    useEffect(() => {
        const coordinatesHandler = (data: unknown) => {
            console.log("Coordinates handler received data:", data);
            // User will write their code inside here
            // TODO: Write temp to DB
            // Then settle 
        };

        webSocketService.addCoordinatesListener(coordinatesHandler);
        return () => webSocketService.removeCoordinatesListener(coordinatesHandler);
    }, []);

    const { address: account } = useAccount();
    const { data: walletClient } = useWalletClient();

    // Initialize WebSocket connection and session key
    useEffect(() => {
        // Get or generate session key on startup
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

    // Handle authentication
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

    // Process pending auth challenge when walletClient becomes available
    useEffect(() => {
        const processPendingAuthChallenge = async () => {
            if (pendingAuthChallenge && walletClient && sessionKey && account && sessionExpireTimestamp) {
                console.log("Processing pending auth challenge");

                const authParams = {
                    scope: AUTH_SCOPE,
                    application: walletClient.account?.address as `0x${string}`,
                    participant: sessionKey.address as `0x${string}`,
                    expire: sessionExpireTimestamp,
                    allowances: [],
                };

                const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain());

                try {
                    const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, pendingAuthChallenge);
                    console.log("Auth Verify Payload:", authVerifyPayload);
                    webSocketService.send(authVerifyPayload);
                    setPendingAuthChallenge(null); // Clear after processing
                } catch (error) {
                    console.error('Failed to process pending auth challenge:', error);
                    alert('Signature rejected. Please try again.');
                    setIsNitroliteAuthAttempted(false);
                    setPendingAuthChallenge(null);
                }
            }
        };

        processPendingAuthChallenge();
    }, [pendingAuthChallenge, walletClient, sessionKey, account, sessionExpireTimestamp]);

    // Handle server messages
    useEffect(() => {
        const handleMessage = async (data: unknown) => {
            console.log("Recieved message: ", data)
            const response = parseAnyRPCResponse(JSON.stringify(data as string));

            // Handle auth challenge
            if (response.method === RPCMethod.AuthChallenge) {
                const challengeResponse = response as AuthChallengeResponse;

                // If walletClient is available, process immediately
                if (walletClient && sessionKey && account && sessionExpireTimestamp) {
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
                        console.log("Auth Verify Payload:", authVerifyPayload);
                        webSocketService.send(authVerifyPayload);
                    } catch (error) {
                        alert('Signature rejected. Please try again.');
                        setIsNitroliteAuthAttempted(false);
                    }
                } else {
                    // Store the challenge for later processing
                    console.log("WalletClient not available, storing auth challenge for later");
                    setPendingAuthChallenge(challengeResponse);
                }
            }

            // Handle auth success
            if (response.method === RPCMethod.AuthVerify && response.params?.success) {
                console.log("🟢 Nitrolite Authenticated");
                setIsNitroliteAuthenticated(true);
                if (response.params.jwtToken) storeJWT(response.params.jwtToken);
            }

            // Handle balance responses
            if (response.method === RPCMethod.GetLedgerBalances) {
                const balanceResponse = response as GetLedgerBalancesResponse;
                const balances = balanceResponse.params.ledgerBalances;

                if (balances && balances.length > 0) {
                    const balancesMap = Object.fromEntries(
                        balances.map((balance) => [balance.asset, balance.amount]),
                    );
                    setBalances(balancesMap);
                } else {
                    setBalances({});
                }
                setIsLoadingBalances(false);
            }

            // Handle live balance updates
            if (response.method === RPCMethod.BalanceUpdate) {
                const balanceUpdate = response as BalanceUpdateResponse;
                const balances = balanceUpdate.params.balanceUpdates;

                const balancesMap = Object.fromEntries(
                    balances.map((balance) => [balance.asset, balance.amount]),
                );
                setBalances(balancesMap);
            }

            // Handle CreateAppSession response
            if (response.method === RPCMethod.CreateAppSession) {
                const appSessionResponse = response as CreateAppSessionResponse;
                console.log('🟢 App Session Created:', appSessionResponse.params.appSessionId);

                setAppSessionId(appSessionResponse.params.appSessionId);
                setIsAppSessionCreated(true);
                setIsCreatingAppSession(false);
                appStateVersionRef.current = 2; // Reset app state version to 1 for new session
                console.log('🟢 App State Version reset to 1 for new session');
            }

            // Handle Message responses
            if (response.method === RPCMethod.SubmitAppState) {
                const messageResponse = response as SubmitAppStateResponse;
                console.log('🟡 NITROLITE MESSAGE RECEIVED:', messageResponse.params);

                // Add message to our messages array
                setMessages(prev => [...prev, messageResponse.params]);

                // Reset coordinates sending state if this was a coordinates message
                if (isSendingCoordinates) {
                    setIsSendingCoordinates(false);
                }
            }

            // Handle transfer responses
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
                console.error('response RPC:', response);

                if (isTransferring) {
                    setIsTransferring(false);
                    setTransferStatus(null);
                    alert(`Transfer failed: ${response.params.error}`);
                } else if (isCreatingAppSession) {
                    setIsCreatingAppSession(false);
                    alert(`App session creation failed: ${response.params.error}`);
                } else if (isSendingMessage) {
                    setIsSendingMessage(false);
                    alert(`Message sending failed: ${response.params.error}`);
                } else if (isSendingCoordinates) {
                    setIsSendingCoordinates(false);
                    alert(`Coordinates sending failed: ${response.params.error}`);
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
    }, [walletClient, sessionKey, sessionExpireTimestamp, account, isTransferring, isCreatingAppSession, isSendingMessage, isSendingCoordinates]);

    // Automatically fetch balances when user is authenticated
    useEffect(() => {
        if (isNitroliteAuthenticated && sessionKey && account) {
            setIsLoadingBalances(true);

            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

            createGetLedgerBalancesMessage(sessionSigner, account)
                .then((getBalancesPayload) => {
                    webSocketService.send(getBalancesPayload);
                })
                .catch((error) => {
                    console.error('Failed to create balance request:', error);
                    setIsLoadingBalances(false);
                });
        }
    }, [isNitroliteAuthenticated, sessionKey, account]);

    // Actions
    const createAppSession = async () => {
        if (!sessionKey || !account || isCreatingAppSession) {
            console.error('Cannot create app session: missing requirements or already creating');
            return;
        }

        setIsCreatingAppSession(true);

        const appDefinition: RPCAppDefinition = {
            protocol: APP_PROTOCOL,
            participants: [account as `0x${string}`, serverWalletAddress as `0x${string}`],
            weights: DEFAULT_WEIGHTS,
            quorum: DEFAULT_QUORUM,
            challenge: 0,
            nonce: Date.now()
        };

        // Commented out - No token allocations required for now
        const allocations: RPCAppSessionAllocation[] = [];
        // const allocations: RPCAppSessionAllocation[] = [
        //     {
        //         participant: account as `0x${string}`,
        //         asset: 'QC',
        //         amount: '1',
        //     },
        //     {
        //         participant: serverWalletAddress as `0x${string}`,
        //         asset: 'QC',
        //         amount: '0',
        //     },
        // ];

        const allocations: RPCAppSessionAllocation[] = [
            {
                participant: account as `0x${string}`,
                asset: 'QC',
                amount: '1',
            },
            {
                participant: serverWalletAddress as `0x${string}`,
                asset: 'QC',
                amount: '0',
            },
        ];

        const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

        try {
            const appSessionPayload = await createAppSessionMessage(sessionSigner, {
                definition: appDefinition,
                allocations,
            });

            webSocketService.send(appSessionPayload);
        } catch (error) {
            console.error('Failed to create app session request:', error);
            setIsCreatingAppSession(false);
        }
    };

    const sendMessage = async (messageBody: string) => {
        if (!sessionKey || !appSessionId) {
            console.error('🔴 Cannot send message - Session:', !!sessionKey, 'AppSession:', !!appSessionId);
            return;
        }

        // Don't block on isSendingMessage - allow rapid-fire messages
        setIsSendingMessage(true);

        const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

        try {
            const currentAppStateVersion = appStateVersionRef.current;
            appStateVersionRef.current += 1; // Increment immediately for next message
            
            const messagePayload = await createSubmitAppStateMessage(sessionSigner, {
                app_session_id: appSessionId as `0x${string}`,
                intent: RPCAppStateIntent.Operate,
                version: currentAppStateVersion, // Use tracked version
                // Commented out - No token allocations required for now
                allocations: [],
                // allocations: [
                //     {
                //         participant: account as `0x${string}`,
                //         asset: 'QC',
                //         amount: '1',
                //     },
                //     {
                //         participant: serverWalletAddress as `0x${string}`,
                //         asset: 'QC',
                //         amount: '0',
                //     },
                // ],

                allocations: [
                    {
                        participant: account as `0x${string}`,
                        asset: 'QC',
                        amount: '1',
                    },
                    {
                        participant: serverWalletAddress as `0x${string}`,
                        asset: 'QC',
                        amount: '0',
                    },
                ],
                session_data: messageBody,
            });

            console.log('🟡 Sending Nitrolite message via WebSocket [AppState v' + currentAppStateVersion + '] → Next: ' + appStateVersionRef.current);
            webSocketService.send(messagePayload);
            
            // Reset flag immediately after send (don't wait for response)
            setTimeout(() => setIsSendingMessage(false), 100);
        } catch (error) {
            console.error('🔴 Failed to create message:', error);
            setIsSendingMessage(false);
        }
    };

    const sendCoordinates = async (x: number, y: number, payload: unknown) => {
        if (!sessionKey || !appSessionId || isSendingCoordinates) {
            console.error('Cannot send coordinates: missing requirements or already sending');
            return;
        }

        setIsSendingCoordinates(true);

        const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

        try {
            const currentAppStateVersion = appStateVersionRef.current;
            appStateVersionRef.current += 1; // Increment immediately for next message
            
            let coordinatesData: { x: number; y: number;[key: string]: unknown } = { x, y };

            if (typeof payload === 'object' && payload !== null) {
                coordinatesData = { ...coordinatesData, ...payload as Record<string, unknown> };
            }

            const messagePayload = await createSubmitAppStateMessage(sessionSigner, {
                app_session_id: appSessionId as `0x${string}`,
                intent: RPCAppStateIntent.Operate,
                version: currentAppStateVersion, // Use tracked version
                // Commented out - No token allocations required for now
                allocations: [],
                // allocations: [
                //     {
                //         participant: account as `0x${string}`,
                //         asset: 'QC',
                //         amount: '1',
                //     },
                //     {
                //         participant: serverWalletAddress as `0x${string}`,
                //         asset: 'QC',
                //         amount: '0',
                //     },
                // ],

                allocations: [
                    {
                        participant: account as `0x${string}`,
                        asset: 'QC',
                        amount: '1',
                    },
                    {
                        participant: serverWalletAddress as `0x${string}`,
                        asset: 'QC',
                        amount: '0',
                    },
                ],
                session_data: JSON.stringify(coordinatesData),
            });

            console.log('🟡 Sending coordinates via WebSocket [AppState v' + currentAppStateVersion + '] → Next: ' + appStateVersionRef.current);
            webSocketService.send(messagePayload);
        } catch (error) {
            console.error('Failed to send coordinates:', error);
            setIsSendingCoordinates(false);
        }
    };

    const fetchBalances = async () => {
        if (!sessionKey || !account || !isNitroliteAuthenticated) {
            console.error('Cannot fetch balances: not authenticated');
            return;
        }

        setIsLoadingBalances(true);
        const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

        try {
            const getBalancesPayload = await createGetLedgerBalancesMessage(sessionSigner, account);
            webSocketService.send(getBalancesPayload);
        } catch (error) {
            console.error('Failed to create balance request:', error);
            setIsLoadingBalances(false);
        }
    };

    const handleTransfer = async (params: TransferRequestParams) => {
        if (!sessionKey || !isNitroliteAuthenticated || isTransferring) {
            console.error('Cannot transfer: missing requirements or already transferring');
            return;
        }

        setIsTransferring(true);
        setTransferStatus('Processing transfer...');

        const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

        try {
            // This would need to be implemented based on your transfer requirements
            // For now, just a placeholder
            console.log('Transfer functionality to be implemented');
            setIsTransferring(false);
            setTransferStatus(null);
        } catch (error) {
            console.error('Transfer failed:', error);
            setIsTransferring(false);
            setTransferStatus(null);
        }
    };

    const resetAppStateVersion = () => {
        appStateVersionRef.current = 2;
        console.log('🔄 App State Version manually reset to 1');
    };

    const value: NitroliteContextType = {
        // WebSocket state
        wsStatus,

        // Authentication state
        sessionKey,
        isNitroliteAuthenticated,
        isNitroliteAuthAttempted,
        sessionExpireTimestamp,

        // Balance state
        balances,
        isLoadingBalances,

        // Transfer state
        isTransferring,
        transferStatus,

        // App session state
        appSessionId,
        isAppSessionCreated,
        isCreatingAppSession,

        // Message state
        messages,
        isSendingMessage,

        // Coordinates state
        isSendingCoordinates,

        // Actions
        createAppSession,
        sendMessage,
        sendCoordinates,
        fetchBalances,
        handleTransfer,
        resetAppStateVersion,
    };

    return (
        <NitroliteContext.Provider value={value}>
            {children}
        </NitroliteContext.Provider>
    );
};