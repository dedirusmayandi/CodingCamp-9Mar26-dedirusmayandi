#!/bin/bash

# Run performance tests for the Productivity Dashboard
# This script executes the performance test suite

echo "Running Performance Tests..."
echo "=============================="
echo ""

npx vitest run tests/performance/performance.test.js

echo ""
echo "Performance tests completed."
