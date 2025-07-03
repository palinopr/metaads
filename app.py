"""
Simple Flask app for Railway testing
"""
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "status": "healthy",
        "message": "AI Marketing Automation API",
        "endpoints": {
            "/": "Health check",
            "/api/campaign/create": "Create campaign (POST)"
        }
    })

@app.route('/api/campaign/create', methods=['GET', 'POST'])
def create_campaign():
    return jsonify({
        "success": True,
        "campaign": {
            "id": "demo-123",
            "name": "Demo Campaign",
            "status": "ready"
        },
        "message": "Demo mode - Railway deployment working!"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)