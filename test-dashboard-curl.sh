#!/bin/bash

# Test dashboard call endpoint with empty body
curl -X POST https://metaads-production.up.railway.app/api/test-dashboard-call \
  -H "Content-Type: application/json" \
  -d '{}'