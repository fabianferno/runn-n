import React, { useState } from 'react';
import { useNitroliteMessages, useNitroliteAppSession } from '@/hooks/useNitrolite';

export const MessageInterface: React.FC = () => {
    const { messages, isSendingMessage, sendMessage } = useNitroliteMessages();
    const { isAppSessionCreated } = useNitroliteAppSession();
    const [messageText, setMessageText] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });

    const handleSendTextMessage = async () => {
        if (!messageText.trim()) return;

        const messageBody = {
            type: 'text',
            content: messageText,
            timestamp: Date.now()
        };

        await sendMessage(JSON.stringify(messageBody));
        setMessageText('');
    };

    const handleSendCoordinates = async () => {
        if (!coordinates.lat || !coordinates.lng) {
            alert('Please enter both latitude and longitude');
            return;
        }

        const messageBody = {
            type: 'coordinates',
            lat: parseFloat(coordinates.lat),
            lng: parseFloat(coordinates.lng),
            timestamp: Date.now()
        };

        await sendMessage(JSON.stringify(messageBody));
        setCoordinates({ lat: '', lng: '' });
    };

    const handleSendCurrentLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const messageBody = {
                    type: 'coordinates',
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: Date.now()
                };
                sendMessage(JSON.stringify(messageBody));
            },
            (error) => {
                alert(`Error getting location: ${(error instanceof Error ? error.message : "Unknown error")}`);
            }
        );
    };

    if (!isAppSessionCreated) {
        return (
            <div className="text-gray-500 text-sm">
                Create an app session to start messaging
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span
                    className={`h-3 w-3 rounded-full ${isSendingMessage ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}
                />
                <span>
                    Messages: {isSendingMessage ? 'Sending...' : 'Ready'}
                </span>
            </div>

            {/* Text Message Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendTextMessage()}
                    className="flex-1 px-3 py-2 border rounded"
                    disabled={isSendingMessage}
                />
                <button
                    onClick={handleSendTextMessage}
                    disabled={isSendingMessage || !messageText.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    Send Text
                </button>
            </div>

            {/* Coordinates Input */}
            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Latitude"
                    value={coordinates.lat}
                    onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                    className="px-3 py-2 border rounded"
                    disabled={isSendingMessage}
                />
                <input
                    type="number"
                    placeholder="Longitude"
                    value={coordinates.lng}
                    onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                    className="px-3 py-2 border rounded"
                    disabled={isSendingMessage}
                />
                <button
                    onClick={handleSendCoordinates}
                    disabled={isSendingMessage || !coordinates.lat || !coordinates.lng}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                    Send Coords
                </button>
                <button
                    onClick={handleSendCurrentLocation}
                    disabled={isSendingMessage}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                    Current Location
                </button>
            </div>

            {/* Messages Display */}
            <div className="max-h-60 overflow-y-auto border rounded p-3">
                <h4 className="font-semibold mb-2">Messages:</h4>
                {messages.length === 0 ? (
                    <div className="text-gray-500 text-sm">No messages yet</div>
                ) : (
                    <div className="space-y-2">
                        {messages.map((message, index) => (
                            <div key={index} className="text-sm">
                                {JSON.stringify(message)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};