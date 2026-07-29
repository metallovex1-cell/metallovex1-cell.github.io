// middleware.js - 同时兼容 Vercel 和 EdgeOne Pages 的密码保护中间件

// 核心处理函数：接收 request 对象，返回 Response
async function handleRequest(request) {
    const url = new URL(request.url);

    // 1. 静态资源直接放行（图片、CSS、JS 等）
    const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.ico'];
    if (staticExtensions.some(ext => url.pathname.endsWith(ext))) {
        // 直接请求源站资源
        return fetch(request);
    }

    // 2. 从环境变量获取密码（未设置则默认为 '123'）
    const SITE_PASSWORD = process.env.SITE_PASSWORD || '123';

    // 3. 检查 Cookie 是否已登录
    const cookie = request.headers.get('cookie') || '';
    if (cookie.includes('blog_auth=1')) {
        return fetch(request);
    }

    // 4. 检查 URL 参数中的密码（用于首次登录）
    const password = url.searchParams.get('pwd');
    if (password === SITE_PASSWORD) {
        // 密码正确：设置 Cookie 并重定向到首页
        return new Response(null, {
            status: 302,
            headers: {
                'Location': '/',
                'Set-Cookie': 'blog_auth=1; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Strict'
            }
        });
    }

    // 5. 未登录且密码错误或未提供 → 显示密码输入页面
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>输入密码</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body{display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;background:#f5f5f5}
        .box{background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);text-align:center;max-width:400px;width:90%}
        h2{margin-bottom:8px;color:#333}
        input{padding:14px 20px;font-size:16px;border:2px solid #e5e7eb;border-radius:10px;width:100%;box-sizing:border-box}
        button{padding:14px;font-size:16px;font-weight:600;background:#0070f3;color:#fff;border:none;border-radius:10px;cursor:pointer;width:100%;margin-top:12px}
        button:hover{background:#005bb5}
    </style>
</head>
<body>
    <div class="box">
        <h2>🔒 请输入访问密码 123 </h2>
        <form onsubmit="event.preventDefault(); window.location.href='?pwd=' + document.getElementById('pwd').value">
            <input type="password" id="pwd" placeholder="请输入密码" autofocus>
            <button type="submit">进入</button>
        </form>
    </div>
</body>
</html>`;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// 1️⃣ Vercel 使用默认导出（直接接收 request）
export default handleRequest;

// 2️⃣ EdgeOne Pages 使用命名导出 middleware（接收 context 对象）
export function middleware(context) {
    const { request } = context;
    return handleRequest(request);
}