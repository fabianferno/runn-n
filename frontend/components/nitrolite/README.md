# Nitrolite Provider Pattern

This directory contains a refactored implementation of the Nitrolite integration using React Context and custom hooks for better state management and reusability.

## Architecture

### Provider (`NitroliteProvider`)
- Centralized state management for all Nitrolite-related functionality
- Handles WebSocket connections and message routing
- Manages authentication, balances, app sessions, and messaging
- Located in `/contexts/NitroliteProvider.tsx`

### Hooks (`useNitrolite.ts`)
- Custom hooks for accessing specific pieces of state
- Granular access to different functionality areas
- Located in `/hooks/useNitrolite.ts`

### Components
- **`ConnectionStatus`**: WebSocket and authentication status display
- **`BalanceStatus`**: Balance display component
- **`AppSessionStatus`**: App session creation and management
- **`MessageInterface`**: Real-time messaging interface
- **`NitroliteStatus`**: Main component that combines all status displays

## Usage

### 1. Provider Setup
The `NitroliteProvider` is already set up in the app's context provider (`/context/index.tsx`), so all components have access to the Nitrolite state.

### 2. Using Hooks in Components

```tsx
import { 
    useNitroliteWebSocket, 
    useNitroliteAuth, 
    useNitroliteBalances,
    useNitroliteAppSession,
    useNitroliteMessages 
} from '@/hooks/useNitrolite';

function MyComponent() {
    // WebSocket status
    const { wsStatus } = useNitroliteWebSocket();
    
    // Authentication
    const { isNitroliteAuthenticated, sessionKey } = useNitroliteAuth();
    
    // Balances
    const { balances, isLoadingBalances, fetchBalances } = useNitroliteBalances();
    
    // App sessions
    const { 
        appSessionId, 
        isAppSessionCreated, 
        createAppSession 
    } = useNitroliteAppSession();
    
    // Messaging
    const { messages, sendMessage } = useNitroliteMessages();
    
    // Your component logic...
}
```

### 3. Available Hooks

#### `useNitroliteWebSocket()`
- `wsStatus`: Current WebSocket connection status

#### `useNitroliteAuth()`
- `isNitroliteAuthenticated`: Whether user is authenticated
- `isNitroliteAuthAttempted`: Whether auth attempt was made
- `sessionKey`: Current session key
- `sessionExpireTimestamp`: When session expires

#### `useNitroliteBalances()`
- `balances`: Current balance data
- `isLoadingBalances`: Whether balances are being fetched
- `fetchBalances()`: Function to manually fetch balances

#### `useNitroliteAppSession()`
- `appSessionId`: Current app session ID
- `isAppSessionCreated`: Whether app session is created
- `isCreatingAppSession`: Whether app session is being created
- `createAppSession(partnerAddress)`: Function to create new app session

#### `useNitroliteMessages()`
- `messages`: Array of received messages
- `isSendingMessage`: Whether a message is being sent
- `sendMessage(messageBody)`: Function to send a message

#### `useNitroliteTransfer()`
- `isTransferring`: Whether a transfer is in progress
- `transferStatus`: Current transfer status
- `handleTransfer(params)`: Function to initiate transfer

### 4. App Session and Messaging

#### Creating an App Session
```tsx
const { createAppSession } = useNitroliteAppSession();

const handleCreateSession = async () => {
    const partnerAddress = '0x1234567890123456789012345678901234567890';
    await createAppSession(partnerAddress);
};
```

#### Sending Messages
```tsx
const { sendMessage } = useNitroliteMessages();

// Send text message
const handleSendText = async () => {
    await sendMessage({
        type: 'text',
        content: 'Hello!',
        timestamp: Date.now()
    });
};

// Send coordinates
const handleSendCoords = async () => {
    await sendMessage({
        type: 'coordinates',
        lat: 40.7128,
        lng: -74.0060,
        timestamp: Date.now()
    });
};
```

#### Receiving Messages
Messages are automatically received and stored in the `messages` array. Each message includes:
- `type`: Message type (e.g., 'text', 'coordinates')
- `content`: Message content (for text messages)
- `lat`, `lng`: Coordinates (for coordinate messages)
- `timestamp`: When the message was sent

### 5. Example Component
See `/components/nitrolite/ExampleUsage.tsx` for a complete example of how to use all the hooks.

## Key Features

1. **Centralized State**: All Nitrolite state is managed in one place
2. **Granular Access**: Use only the hooks you need for specific functionality
3. **Real-time Updates**: Automatic handling of WebSocket messages and state updates
4. **Type Safety**: Full TypeScript support with proper typing
5. **Easy Integration**: Simple to use in any component within the provider tree

## App Session Protocol

The app session uses the following configuration:
- **Protocol**: `NitroRPC/0.4`
- **Participants**: User address and partner address
- **Weights**: Equal participation (50, 50)
- **Quorum**: 100% (both participants must agree)
- **Challenge**: 0
- **Nonce**: Current timestamp

This setup allows for secure, multi-party applications where both participants must agree on state changes.
