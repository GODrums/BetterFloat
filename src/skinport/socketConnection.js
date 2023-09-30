import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const userCurrency = await (async () => {
    const response = await fetch('https://skinport.com/api/data/');
    const data = await response.json();
    return data.currency;
})();
startSocket();

function startSocket() {
    console.log('[BetterFloat] Connecting to Skinport Socket...');

    // Connect to Skinport Websocket with Socket.io, url: wss://skinport.com/socket.io/?transport=websocket
    const socket = io('https://skinport.com', {
        transports: ['websocket'],
    });

    //Types of events that can be received from the websocket:
    // 1. saleFeed - Sale Feed
    // 2. steamStatusUpdated - Steam Status
    // 3. maintenanceUpdated - Maintenance status
    // 4. sid - session ID

    // Listen to the Sale Feed
    socket.on('saleFeed', (data) => {
        document.dispatchEvent(
            new CustomEvent('BetterFloat_WEBSOCKET_EVENT', {
                detail: {
                    eventType: data.eventType,
                    data: data.sales,
                },
            })
        );
    });

    socket.on("connect", () => {
        console.log("[BetterFloat] Successfully connected to websocket: wss://skinport.com/socket.io/?transport=websocket.");
        // Join Sale Feed with parameters.
        if (userCurrency) {
            socket.emit('saleFeedJoin', { currency: userCurrency, locale: 'en', appid: 730 });
        } else {
            socket.emit('saleFeedJoin', { currency: 'USD', locale: 'en', appid: 730 });
        }
    });
}