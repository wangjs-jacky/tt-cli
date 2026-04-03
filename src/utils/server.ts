import http from 'http';

interface CallbackResult {
  code: string;
  close: () => void;
}

/**
 * 创建临时本地 HTTP 服务器，等待 OAuth2 回调
 * 返回 Promise，在收到合法回调时 resolve
 */
export function createCallbackServer(
  expectedState: string,
  port: number
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>授权失败：state 不匹配</h1>');
        reject(new Error('CSRF state 不匹配'));
        server.close();
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>授权失败：缺少 code 参数</h1>');
        reject(new Error('缺少授权码'));
        server.close();
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><h1>✅ 授权成功！请返回终端。</h1></body></html>');

      resolve({
        code,
        close: () => server.close(),
      });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用，请关闭占用该端口的程序或等待重试`));
      } else {
        reject(err);
      }
    });

    server.listen(port);
  });
}
