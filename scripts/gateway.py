#!/usr/bin/env python3
"""
Gateway Routing — Gerbang Utama Salon Eyelash ERP v2

Gateway ini berfungsi sebagai entry point tunggal yang merutekan permintaan
ke frontend dan backend yang sesuai. Semua akses melalui port 8080.

▸ Routing Path:
  /              → Redirect (302) ke /pos
  /pos           → POS Lite frontend (dari apps/pos-lite/frontend/dist)
  /pos/api/*     → Proxy ke POS backend (localhost:4000/api/*)
  /erp           → ERP Core frontend (dari apps/erp-core/frontend/dist)
  /erp/api/*     → Proxy ke ERP backend (localhost:5000/api/*)
  /dashboard, /bookings, /receipt → POS SPA fallback (index.html)
  /serviceWorker.js, /sw.js, /assets/*, /icons/* → PWA files dari POS dist

▸ Port Mapping:
  Gateway :8080  ← user-facing
  POS API :4000  ← internal (tidak langsung diakses)
  ERP API :5000  ← internal (tidak langsung diakses)

▸ Fitur:
  - Proxy HTTP untuk API calls (GET, POST, PUT, DELETE, PATCH)
  - Serve file statis untuk frontend (HTML, JS, CSS, JSON, SVG, PNG, ICO)
  - SPA fallback — mengembalikan index.html untuk rute yang tidak dikenal
  - Redirect root ke POS
  - Logging dengan prefix [GATEWAY]
"""
import http.server
import urllib.request
import os
import sys

POS_FRONTEND = "/home/ubuntu/salon-eyelash-v2/apps/pos-lite/frontend/dist"
ERP_FRONTEND = "/home/ubuntu/salon-eyelash-v2/apps/erp-core/frontend/dist"

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.route()
    def do_POST(self):
        self.route()
    def do_PUT(self):
        self.route()
    def do_DELETE(self):
        self.route()
    def do_PATCH(self):
        self.route()
    
    def route(self):
        path = self.path
        
        # POS API proxy
        if path.startswith('/pos/api/'):
            url = f'http://localhost:4000/api/{path[9:]}'
            return self.proxy(url)
        
        # ERP API proxy
        if path.startswith('/erp/api/'):
            url = f'http://localhost:5000/api/{path[9:]}'
            return self.proxy(url)
        
        # POS frontend (also serve /dashboard, /bookings and /pos SPA routes)
        POS_SPA_ROUTES = ['/dashboard', '/bookings', '/receipt']
        if any(path.startswith(r) for r in POS_SPA_ROUTES):
            local = POS_FRONTEND + '/index.html'
            return self.serve_file(local)
        if path.startswith('/pos') or path == '/pos':
            if path == '/pos':
                path = '/pos/index.html'
            prefix = '/pos'
            local = POS_FRONTEND + path[len(prefix):] if len(path) > len(prefix) else POS_FRONTEND + '/index.html'
            return self.serve_file(local)
        
        # ERP frontend
        if path.startswith('/erp'):
            if path == '/erp':
                path = '/erp/index.html'
            prefix = '/erp'
            local = ERP_FRONTEND + path[len(prefix):] if len(path) > len(prefix) else ERP_FRONTEND + '/index.html'
            return self.serve_file(local)
        
        # Serve root-level PWA files from POS dist (SW registration hardcoded by Vite)
        PWA_FILES = ['serviceWorker.js', 'sw.js', 'registerSW.js', 'manifest.json', 'manifest.webmanifest', 'favicon.svg', 'workbox-e4022e15.js']
        if path.lstrip('/') in PWA_FILES or path.startswith('/icons/'):
            local = POS_FRONTEND + path
            return self.serve_file(local)
        if path.startswith('/assets/'):
            local = POS_FRONTEND + path
            return self.serve_file(local)
        
        # Redirect root to POS
        if path == '/' or path == '':
            self.send_response(302)
            self.send_header('Location', '/pos')
            self.end_headers()
            return
        
        # 404 for anything else
        self.send_response(404)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Not found')
    
    def serve_file(self, local):
        if os.path.exists(local) and not os.path.isdir(local):
            self.send_response(200)
            if local.endswith('.html'): self.send_header('Content-Type', 'text/html; charset=utf-8')
            elif local.endswith('.js'): self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            elif local.endswith('.css'): self.send_header('Content-Type', 'text/css; charset=utf-8')
            elif local.endswith('.json'): self.send_header('Content-Type', 'application/json')
            elif local.endswith('.svg'): self.send_header('Content-Type', 'image/svg+xml')
            elif local.endswith('.png'): self.send_header('Content-Type', 'image/png')
            elif local.endswith('.ico'): self.send_header('Content-Type', 'image/x-icon')
            self.end_headers()
            with open(local, 'rb') as f:
                self.wfile.write(f.read())
        else:
            # SPA fallback
            base = POS_FRONTEND if '/pos/' in self.path else ERP_FRONTEND
            index = os.path.join(base, 'index.html')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            with open(index, 'rb') as f:
                self.wfile.write(f.read())
    
    def proxy(self, url):
        try:
            req = urllib.request.Request(url, method=self.command)
            for k, v in self.headers.items():
                if k.lower() not in ('host', 'connection', 'accept-encoding', 'content-length'):
                    req.add_header(k, v)
            content_len = int(self.headers.get('Content-Length', 0))
            if content_len > 0:
                req.data = self.rfile.read(content_len)
            
            resp = urllib.request.urlopen(req)
            self.send_response(resp.status)
            for k, v in resp.headers.items():
                if k.lower() not in ('transfer-encoding', 'content-encoding', 'connection'):
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f'Proxy error: {e}'.encode())
    
    def log_message(self, format, *args):
        print(f"[GATEWAY] {args[0]} {args[1]} {args[2]}")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = http.server.HTTPServer(('0.0.0.0', port), ProxyHandler)
    print(f"🌐 Gateway running on http://localhost:{port}")
    print(f"   / → Redirects to /pos")
    print(f"   /pos → POS Lite (backend :4000)")
    print(f"   /erp → ERP Core (backend :5000)")
    server.serve_forever()
