#!/bin/bash
# Simple API testing script for Mission Control

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Read Convex URL from .env.local
if [ -f .env.local ]; then
    CONVEX_URL=$(grep NEXT_PUBLIC_CONVEX_URL .env.local | cut -d '=' -f2)
else
    echo -e "${RED}Error: .env.local not found. Run 'npx convex dev' first.${NC}"
    exit 1
fi

if [ -z "$CONVEX_URL" ]; then
    echo -e "${RED}Error: NEXT_PUBLIC_CONVEX_URL not set in .env.local${NC}"
    exit 1
fi

echo -e "${BLUE}Testing Mission Control API${NC}"
echo -e "Convex URL: ${CONVEX_URL}"
echo ""

# Test 1: List tasks
echo -e "${BLUE}Test 1: GET /api/tasks${NC}"
response=$(curl -s "$CONVEX_URL/api/tasks")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}✗ Failed${NC}"
fi
echo ""

# Test 2: Create task (if DEMO_USER_ID is set)
if [ ! -z "$DEMO_USER_ID" ]; then
    echo -e "${BLUE}Test 2: POST /api/tasks${NC}"
    response=$(curl -s -X POST "$CONVEX_URL/api/tasks" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"Test Task from Script\",
            \"description\": \"Created at $(date)\",
            \"priority\": \"medium\",
            \"createdBy\": \"$DEMO_USER_ID\"
        }")
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    echo ""
else
    echo -e "${BLUE}Test 2: POST /api/tasks${NC}"
    echo -e "${RED}Skipped - DEMO_USER_ID not set${NC}"
    echo "Set it with: export DEMO_USER_ID=your-user-id"
    echo ""
fi

echo -e "${GREEN}API testing complete!${NC}"
