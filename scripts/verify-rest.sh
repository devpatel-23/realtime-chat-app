#!/usr/bin/env bash
set -e

PORT=4000
BASE_URL="http://localhost:$PORT"

echo "=== Verifying REST Endpoints against $BASE_URL ==="

echo -e "\n1. Testing GET /health"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/health"

echo -e "\n2. Testing POST /api/login (valid user)"
curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"curl_verifier"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n3. Testing POST /api/login (invalid empty user)"
curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":""}' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n4. Testing POST /api/messages"
curl -s -X POST "$BASE_URL/api/messages" \
  -H "Content-Type: application/json" \
  -d '{"username":"curl_verifier","text":"Hello world from automated curl test!"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n5. Testing GET /api/messages?limit=5"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/api/messages?limit=5"

echo -e "\n6. Testing GET /api/users/online"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/api/users/online"

echo -e "\n=== All REST curl verifications complete ==="
