import { useNitrolite as useNitroliteContext } from "@/contexts/NitroliteProvider";

// Re-export the main hook
export { useNitroliteContext as useNitrolite };

// Individual hooks for specific state pieces
export const useNitroliteWebSocket = () => {
  const { wsStatus } = useNitroliteContext();
  return { wsStatus };
};

export const useNitroliteAuth = () => {
  const {
    isNitroliteAuthenticated,
    isNitroliteAuthAttempted,
    sessionKey,
    sessionExpireTimestamp,
  } = useNitroliteContext();

  return {
    isNitroliteAuthenticated,
    isNitroliteAuthAttempted,
    sessionKey,
    sessionExpireTimestamp,
  };
};

export const useNitroliteBalances = () => {
  const { balances, isLoadingBalances, fetchBalances } = useNitroliteContext();

  return {
    balances,
    isLoadingBalances,
    fetchBalances,
  };
};

export const useNitroliteTransfer = () => {
  const { isTransferring, transferStatus, handleTransfer } =
    useNitroliteContext();

  return {
    isTransferring,
    transferStatus,
    handleTransfer,
  };
};

export const useNitroliteAppSession = () => {
  const {
    appSessionId,
    isAppSessionCreated,
    isCreatingAppSession,
    createAppSession,
    resetAppStateVersion,
  } = useNitroliteContext();

  return {
    appSessionId,
    isAppSessionCreated,
    isCreatingAppSession,
    createAppSession,
    resetAppStateVersion,
  };
};

export const useNitroliteMessages = () => {
  const { messages, isSendingMessage, sendMessage } = useNitroliteContext();

  return {
    messages,
    isSendingMessage,
    sendMessage,
  };
};
