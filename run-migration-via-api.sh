#!/bin/bash
# Script to run the ImageKit migration via the API endpoint

echo "=== ImageKit Migration via API ==="
echo ""

# Check if server is running
if ! lsof -ti:3000 > /dev/null 2>&1; then
  echo "❌ Error: Server is not running on port 3000"
  echo "Please start your server first: node Server.js"
  exit 1
fi

echo "✓ Server is running"
echo ""

# Get auth token (you'll need to provide your admin credentials)
echo "Please provide admin credentials:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""
echo ""

echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Please check your credentials."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Login successful"
echo ""
echo "Running migration..."
echo ""

MIGRATION_RESPONSE=$(curl -s -X POST http://localhost:3000/migration/run-imagekit-migration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$MIGRATION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MIGRATION_RESPONSE"

echo ""
echo "✅ Migration request completed!"


