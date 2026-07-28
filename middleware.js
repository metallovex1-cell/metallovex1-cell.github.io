// middleware.js - Vercel Edge Middleware 格式
export default function middleware(request) {
  const requiredPassword = process.env.SITE_PASSWORD || 'default123'

  // 检查 Cookie 中是否已有登录标记
  const cookieHeader = request.headers.get('cookie') || ''
  const isLoggedIn = cookieHeader.includes('blog_auth=1')

  // 如果已登录，直接放行
  if (isLoggedIn) {
    return new Response(null, {
      status: 200,
      headers: {
        'x-middleware-rewrite': request.url,
      },
    })
  }

  // 检查 URL 参数中的密码
  const url = new URL(request.url)
  const password = url.searchParams.get('pwd')

  // 如果密码正确，设置 Cookie 并跳转到首页
  if (password === requiredPassword) {
    const headers = new Headers()
    headers.append('Set-Cookie', 'blog_auth=1; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Strict')
    headers.append('Location', '/')
    return new Response(null, {
      status: 302,
      headers,
    })
  }

  // 未登录且密码错误或未提供，显示密码输入页面
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>输入密码</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: -apple-system, sans-serif; background: #f5f5f5; }
          .box { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
          h2 { margin-bottom: 12px; color: #333; font-weight: 600; }
          p { color: #666; font-size: 14px; margin-bottom: 24px; }
          .input-group { display: flex; flex-direction: column; gap: 12px; }
          input { padding: 14px 20px; font-size: 16px; border: 2px solid #e5e7eb; border-radius: 10px; outline: none; transition: border-color 0.2s; }
          input:focus { border-color: #0070f3; }
          button { padding: 14px 24px; font-size: 16px; font-weight: 600; background: #0070f3; color: white; border: none; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
          button:hover { background: #005bb5; }
          .error { color: #e53e3e; font-size: 14px; margin-top: 12px; display: none; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>🔒 请输入访问密码</h2>
          <p>此博客为内部资料，需要密码才能访问</p>
          <form onsubmit="event.preventDefault(); const pwd=document.getElementById('pwd').value; if(!pwd){document.getElementById('error').style.display='block'}else{window.location.href='?pwd='+encodeURIComponent(pwd)}">
            <div class="input-group">
              <input type="password" id="pwd" placeholder="请输入密码" autofocus />
              <button type="submit">进入博客</button>
            </div>
            <div id="error" class="error">请先输入密码</div>
          </form>
        </div>
      </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}

// 配置匹配所有路径（排除静态资源）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}