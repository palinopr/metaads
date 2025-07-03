#!/usr/bin/env python3
"""
Simple HTTP server for Railway
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "message": "Railway Python deployment working!",
                "port": os.environ.get('PORT', 'not set')
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), SimpleHandler)
    print(f"Server running on port {port}")
    server.serve_forever()