
echo "======================================="
echo "Analytics Backend API Testing Suite"
echo "======================================="
echo ""

# Configuration
API_URL="http://localhost:3000"
SITE_ID="test-site-$(date +%s)"
DATE=$(date -u +%Y-%m-%d)

echo "🔧 Configuration:"
echo "   API URL: $API_URL"
echo "   Site ID: $SITE_ID"
echo "   Test Date: $DATE"
echo ""

# Test 1: Health Check
echo "✅ Test 1: Health Check"
curl -s -X GET "$API_URL/health" | json_pp
echo -e "\n"

# Test 2: Valid Event Ingestion
echo "✅ Test 2: Valid Event Ingestion"
curl -s -X POST "$API_URL/event" \
  -H "Content-Type: application/json" \
  -d "{\"site_id\":\"$SITE_ID\",\"event_type\":\"page_view\",\"path\":\"/home\",\"user_id\":\"user-1\",\"timestamp\":\"${DATE}T10:00:00Z\"}" | json_pp
echo -e "\n"

# Test 3: Multiple Events for Statistics
echo "✅ Test 3: Sending Multiple Events..."
for i in {1..5}; do
  curl -s -X POST "$API_URL/event" \
    -H "Content-Type: application/json" \
    -d "{\"site_id\":\"$SITE_ID\",\"event_type\":\"page_view\",\"path\":\"/page$i\",\"user_id\":\"user-$i\",\"timestamp\":\"${DATE}T10:0${i}:00Z\"}" > /dev/null
  echo "   Event $i sent"
done
echo "   Waiting 3 seconds for worker to process..."
sleep 3
echo ""

# Test 4: Invalid Event - Missing Required Fields
echo "✅ Test 4: Invalid Event (Missing site_id)"
curl -s -X POST "$API_URL/event" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"page_view\",\"path\":\"/test\"}" | json_pp
echo -e "\n"

# Test 5: Invalid Event - Missing event_type
echo "✅ Test 5: Invalid Event (Missing event_type)"
curl -s -X POST "$API_URL/event" \
  -H "Content-Type: application/json" \
  -d "{\"site_id\":\"$SITE_ID\",\"path\":\"/test\"}" | json_pp
echo -e "\n"

# Test 6: Get Statistics
echo "✅ Test 6: Retrieve Statistics"
curl -s -X GET "$API_URL/stats?site_id=$SITE_ID&date=$DATE" | json_pp
echo -e "\n"

# Test 7: Stats - Missing site_id
echo "✅ Test 7: Stats Error (Missing site_id)"
curl -s -X GET "$API_URL/stats?date=$DATE" | json_pp
echo -e "\n"

# Test 8: Stats - Missing date
echo "✅ Test 8: Stats Error (Missing date)"
curl -s -X GET "$API_URL/stats?site_id=$SITE_ID" | json_pp
echo -e "\n"

# Test 9: Stats - Invalid date format
echo "✅ Test 9: Stats Error (Invalid date)"
curl -s -X GET "$API_URL/stats?site_id=$SITE_ID&date=invalid-date" | json_pp
echo -e "\n"

echo "======================================="
echo "✅ All Tests Completed!"
echo "======================================="
