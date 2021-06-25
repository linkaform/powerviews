#!/bin/sh

curl="curl --fail-with-body -v"
set -e
$curl -X POST "http://localhost:8080/v1/accounts" -H "accept: application/json" -H "X-API-KEY: abcd" -H "Content-Type: application/json" -d "{\"apikey\":\"jwt xxxyyyzzz...\",\"name\":\"1259\",\"id\":100,\"email\":\"juan.perez@example.com\",\"desc\":\"Juan perez\"}"
$curl -X GET "http://localhost:8080/v1/accounts/100" -H "accept: application/json" -H "X-API-KEY: abcd"
