import functools
import http.server
import os
import socketserver
from pathlib import Path

DIR = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("PORT", "5510"))
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIR))
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("serving", DIR, "on", PORT)
    httpd.serve_forever()
