import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface UseSSEReturn {
    isConnected: boolean;
    lastMessage: any;
    subscribe: (userId: string, isAgency?: boolean) => void;
    unsubscribe: () => void;
}

interface SSEMessage {
    type: string;
    data?: any;
    message?: string;
    timestamp?: number;
}

export const useSSE = (
    onMessage?: (message: SSEMessage) => void
): UseSSEReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const { user } = useAuth();
    const eventSourceRef = useRef<EventSource | null>(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const subscribe = useCallback((userId: string, isAgency: boolean = false) => {
        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const endpoint = isAgency ? '/sse/agency-notifications' : '/sse/notifications';
        const url = `${API_BASE_URL}${endpoint}`;

        logger.info(`Attempting SSE connection to: ${url}`);

        try {
            const eventSource = new EventSource(url, {
                withCredentials: true
            });

            eventSource.onopen = () => {
                logger.info('SSE connection established');
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const message: SSEMessage = JSON.parse(event.data);
                    logger.info('SSE message received:', message);

                    setLastMessage(message);

                    if (onMessageRef.current) {
                        onMessageRef.current(message);
                    }
                } catch (error) {
                    logger.error('Failed to parse SSE message:', error);
                }
            };

            eventSource.onerror = (error) => {
                logger.error('SSE connection error:', error);
                setIsConnected(false);

                // Auto-reconnect after 5 seconds
                setTimeout(() => {
                    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CLOSED) {
                        logger.info('Attempting SSE reconnection...');
                        subscribe(userId, isAgency);
                    }
                }, 5000);
            };

            eventSourceRef.current = eventSource;

        } catch (error) {
            logger.error('Failed to create SSE connection:', error);
            setIsConnected(false);
        }
    }, []);

    const unsubscribe = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
            logger.info('SSE connection closed');
        }
    }, []);

    // Auto-subscribe when user is available
    useEffect(() => {
        if (user && user._id) {
            const isAgency = user.role === 'agency_admin';
            subscribe(user._id, isAgency);
        }

        return () => {
            unsubscribe();
        };
    }, [user, subscribe, unsubscribe]);

    return {
        isConnected,
        lastMessage,
        subscribe,
        unsubscribe
    };
};

export default useSSE;
