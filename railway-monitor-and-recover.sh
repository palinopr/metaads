#!/bin/bash

# Railway Monitor and Recovery Script
# Monitors deployments and automatically recovers from crashes

set -e

echo "🚨 Railway Monitor & Recovery System"
echo "==================================="
echo ""

# Configuration
PYTHON_SERVICE="metaads-python-api"
NEXTJS_SERVICE="metaads"
CHECK_INTERVAL=60  # seconds
MAX_RETRIES=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a railway-monitor.log
}

# Check service health
check_service_health() {
    local service=$1
    local url=$2
    
    if [ -z "$url" ]; then
        echo -e "${YELLOW}⚠️  No URL provided for $service${NC}"
        return 2
    fi
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is down (HTTP $response)${NC}"
        return 1
    fi
}

# Get service logs
get_service_logs() {
    local service=$1
    echo -e "${BLUE}📋 Recent logs for $service:${NC}"
    railway logs --service "$service" -n 20 2>/dev/null || echo "Unable to fetch logs"
}

# Restart service
restart_service() {
    local service=$1
    log "Attempting to restart $service..."
    
    # First, try to redeploy
    railway up --service "$service" --detach 2>/dev/null
    
    # Wait for deployment
    sleep 30
    
    # Check if service is back up
    if railway status --service "$service" 2>/dev/null | grep -q "success"; then
        log "✅ $service restarted successfully"
        return 0
    else
        log "❌ Failed to restart $service"
        return 1
    fi
}

# Fix common issues
fix_common_issues() {
    local service=$1
    
    echo -e "${YELLOW}🔧 Attempting automatic fixes for $service...${NC}"
    
    if [ "$service" = "$PYTHON_SERVICE" ]; then
        # Python service fixes
        log "Applying Python service fixes..."
        
        # Fix runtime.txt
        if [ -f "runtime.txt" ] && ! grep -q "python-3.11.0" runtime.txt; then
            echo "python-3.11.0" > runtime.txt
            log "Fixed runtime.txt format"
        fi
        
        # Ensure Procfile exists
        if [ ! -f "Procfile" ]; then
            echo "web: gunicorn app:app --bind 0.0.0.0:\$PORT --workers 1 --threads 8 --timeout 120" > Procfile
            log "Created missing Procfile"
        fi
        
    elif [ "$service" = "$NEXTJS_SERVICE" ]; then
        # Next.js service fixes
        log "Applying Next.js service fixes..."
        
        # Ensure .railwayignore exists
        if [ ! -f ".railwayignore" ]; then
            ./railway-fix-mixed-deployment.sh 1
            log "Created .railwayignore to exclude Python files"
        fi
        
        # Check node_modules
        if [ ! -d "node_modules" ]; then
            npm install
            log "Installed missing node_modules"
        fi
    fi
}

# Monitor loop
monitor_services() {
    local python_url="https://${PYTHON_SERVICE}.railway.app"
    local nextjs_url="https://${NEXTJS_SERVICE}.railway.app"
    
    # Get actual URLs from user or environment
    if [ -z "$PYTHON_API_URL" ]; then
        read -p "Enter Python API URL [$python_url]: " input_url
        PYTHON_API_URL=${input_url:-$python_url}
    fi
    
    if [ -z "$NEXTJS_APP_URL" ]; then
        read -p "Enter Next.js App URL [$nextjs_url]: " input_url
        NEXTJS_APP_URL=${input_url:-$nextjs_url}
    fi
    
    log "Starting monitoring..."
    log "Python API: $PYTHON_API_URL"
    log "Next.js App: $NEXTJS_APP_URL"
    echo ""
    
    local python_failures=0
    local nextjs_failures=0
    
    while true; do
        echo -e "${BLUE}[$(date '+%H:%M:%S')] Checking services...${NC}"
        
        # Check Python service
        if ! check_service_health "$PYTHON_SERVICE" "$PYTHON_API_URL"; then
            ((python_failures++))
            log "Python service failure #$python_failures"
            
            if [ $python_failures -ge $MAX_RETRIES ]; then
                log "🚨 Python service exceeded max failures"
                get_service_logs "$PYTHON_SERVICE"
                fix_common_issues "$PYTHON_SERVICE"
                restart_service "$PYTHON_SERVICE"
                python_failures=0
            fi
        else
            python_failures=0
        fi
        
        # Check Next.js service
        if ! check_service_health "$NEXTJS_SERVICE" "$NEXTJS_APP_URL"; then
            ((nextjs_failures++))
            log "Next.js service failure #$nextjs_failures"
            
            if [ $nextjs_failures -ge $MAX_RETRIES ]; then
                log "🚨 Next.js service exceeded max failures"
                get_service_logs "$NEXTJS_SERVICE"
                fix_common_issues "$NEXTJS_SERVICE"
                restart_service "$NEXTJS_SERVICE"
                nextjs_failures=0
            fi
        else
            nextjs_failures=0
        fi
        
        echo "💤 Sleeping for $CHECK_INTERVAL seconds..."
        echo ""
        sleep $CHECK_INTERVAL
    done
}

# Create status dashboard
create_status_dashboard() {
    cat > railway-status-dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Railway Services Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .service {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .service.healthy { border-left: 4px solid #4CAF50; }
        .service.unhealthy { border-left: 4px solid #f44336; }
        .service.unknown { border-left: 4px solid #ff9800; }
        .status { font-weight: bold; }
        .healthy .status { color: #4CAF50; }
        .unhealthy .status { color: #f44336; }
        .unknown .status { color: #ff9800; }
        .logs {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Railway Services Status Dashboard</h1>
        <p>Last updated: <span id="lastUpdate"></span></p>
        
        <div class="service" id="pythonService">
            <h2>Python API Service</h2>
            <p>Status: <span class="status">Checking...</span></p>
            <p>URL: <span class="url"></span></p>
            <div class="logs"></div>
        </div>
        
        <div class="service" id="nextjsService">
            <h2>Next.js Frontend</h2>
            <p>Status: <span class="status">Checking...</span></p>
            <p>URL: <span class="url"></span></p>
            <div class="logs"></div>
        </div>
        
        <button onclick="checkServices()">Refresh Status</button>
    </div>
    
    <script>
        const services = {
            python: {
                url: 'https://metaads-python-api.railway.app',
                element: document.getElementById('pythonService')
            },
            nextjs: {
                url: 'https://metaads.railway.app',
                element: document.getElementById('nextjsService')
            }
        };
        
        async function checkService(service) {
            try {
                const response = await fetch(service.url, { mode: 'no-cors' });
                return 'healthy';
            } catch (error) {
                return 'unhealthy';
            }
        }
        
        async function checkServices() {
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
            
            for (const [name, service] of Object.entries(services)) {
                const status = await checkService(service);
                service.element.className = `service ${status}`;
                service.element.querySelector('.status').textContent = 
                    status === 'healthy' ? 'Healthy ✅' : 'Unhealthy ❌';
                service.element.querySelector('.url').textContent = service.url;
            }
        }
        
        // Check on load and every 60 seconds
        checkServices();
        setInterval(checkServices, 60000);
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ Created railway-status-dashboard.html${NC}"
    echo "   Open in browser to view real-time status"
}

# Recovery mode
recovery_mode() {
    echo -e "${RED}🚨 RECOVERY MODE${NC}"
    echo "================"
    echo ""
    
    log "Entering recovery mode..."
    
    # Stop monitoring
    echo "1️⃣ Checking Railway login..."
    if ! railway whoami &> /dev/null; then
        railway login
    fi
    
    echo "2️⃣ Linking to project..."
    railway link
    
    echo "3️⃣ Checking service status..."
    railway status
    
    echo "4️⃣ Applying fixes..."
    
    # Run all fix scripts
    if [ -f "./railway-service-separator.sh" ]; then
        echo "Running service separator..."
        ./railway-service-separator.sh
    fi
    
    if [ -f "./railway-fix-mixed-deployment.sh" ]; then
        echo "Running mixed deployment fix..."
        echo "4" | ./railway-fix-mixed-deployment.sh
    fi
    
    echo "5️⃣ Redeploying services..."
    
    # Deploy Python service
    if [ -d "railway-python-api" ]; then
        cd railway-python-api
        railway up --service "$PYTHON_SERVICE" --detach
        cd ..
    else
        railway up --service "$PYTHON_SERVICE" --detach
    fi
    
    # Deploy Next.js service
    railway up --service "$NEXTJS_SERVICE" --detach
    
    echo ""
    echo -e "${GREEN}✅ Recovery complete!${NC}"
    log "Recovery mode completed"
}

# Main menu
echo "Choose an option:"
echo "1) Start monitoring services"
echo "2) Run recovery mode"
echo "3) Create status dashboard"
echo "4) View recent logs"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        monitor_services
        ;;
    2)
        recovery_mode
        ;;
    3)
        create_status_dashboard
        ;;
    4)
        echo -e "${BLUE}📋 Recent logs:${NC}"
        echo "Python Service:"
        get_service_logs "$PYTHON_SERVICE"
        echo ""
        echo "Next.js Service:"
        get_service_logs "$NEXTJS_SERVICE"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac