const axios = require('axios');

// Configuration
const AUCTION_ID = 4;
const GATEWAY_URL = 'http://localhost:8080';

// Test Creds
const CLIENT_USER = 'load_test_client';
const CLIENT_PASS = 'password123';
const CLIENT_EMAIL = 'load_test@example.com';

// Simulate Users
const users = ['test_user_1', 'test_user_2', 'test_user_3', 'test_user_4'];

async function startSimulation() {
    console.log('[Simulation] Starting Authenticated Load Test...');

    let token = null;

    // 1. Register
    try {
        console.log(`[Auth] Registering ${CLIENT_USER}...`);
        await axios.post(`${GATEWAY_URL}/auth-service/auth/register`, {
            username: CLIENT_USER,
            password: CLIENT_PASS,
            email: CLIENT_EMAIL,
            firstName: 'Load',
            lastName: 'Tester'
        });
        console.log('[Auth] Registered successfully.');
    } catch (err) {
        if (err.response && err.response.status === 409) {
            console.log('[Auth] User already exists. Proceeding to login.');
        } else {
            console.error('[Auth] Registration failed:', err.message);
            if (err.response) console.error(err.response.data);
            // proceed anyway? No, login will fail if reg failed and user doesn't exist.
        }
    }

    // 2. Login
    try {
        console.log(`[Auth] Logging in...`);
        const res = await axios.post(`${GATEWAY_URL}/auth-service/auth/login`, {
            username: CLIENT_USER,
            password: CLIENT_PASS
        });
        token = res.data.access_token;
        console.log('[Auth] Token obtained.');
    } catch (err) {
        console.error('[Auth] Login failed:', err.message);
        if (err.response) console.error(err.response.data);
        return;
    }

    // 3. Join Loop
    for (const userId of users) {
        try {
            console.log(`[Simulation] User ${userId} joining via API...`);

            // Call the Join Endpoint with Token
            // Join endpoint is: /auction-service/auctions/{id}/join?userId={userId}
            // Note: Bidding service join logic is separate but for COUNT we need auction-service.

            const response = await axios.post(
                `${GATEWAY_URL}/auction-service/auctions/${AUCTION_ID}/join?userId=${userId}`,
                null,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            console.log(`[Simulation] Join status: ${response.status}`);
            console.log(`[Simulation] User ${userId} joined successfully.`);

            // Also hit bidding service join to be thorough? 
            // The frontend calls both. Let's call Bidding Service too just in case it affects logic.
            try {
                await axios.post(
                    `${GATEWAY_URL}/bidding-service/turn-manager/auctions/${AUCTION_ID}/join?userId=${userId}`,
                    null,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
                console.log(`[Simulation] User ${userId} also joined Turn Manager.`);
            } catch (e) {
                console.log(`[Simulation] Turn Manager join failed (minor): ${e.message}`);
            }

            // Wait a bit
            await new Promise(r => setTimeout(r, 2000));

        } catch (err) {
            console.error(`[Simulation] Failed to join user ${userId}:`, err.message);
            if (err.response) {
                console.error(`[Simulation] Server responded:`, err.response.data);
            }
        }
    }

    console.log('[Simulation] All users processed.');
}

// Start immediately
startSimulation();
