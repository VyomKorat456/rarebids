import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

let stompClient = null;

export const connectWebSocket = (auctionId, onMessageReceived, onConnected) => {
    // Prevent multiple connections
    if (stompClient?.connected) {
        console.warn("WebSocket already connected.");
        return;
    }

    const token = localStorage.getItem('token');
    const socket = new SockJS(`${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'}/auction-service/ws`);
    stompClient = Stomp.over(socket);

    stompClient.connect({ Authorization: `Bearer ${token}` }, (frame) => {
        console.log('Connected: ' + frame);
        if (onConnected) onConnected();

        stompClient.subscribe(`/topic/auction/${auctionId}`, (message) => {
            if (message.body) {
                onMessageReceived(JSON.parse(message.body));
            }
        });
    }, (error) => {
        console.error("Broker reported error: " + error);
        disconnectWebSocket();
    });
};

export const disconnectWebSocket = () => {
    if (stompClient !== null && stompClient.connected) {
        stompClient.disconnect();
    }
    console.log("Disconnected");
};
