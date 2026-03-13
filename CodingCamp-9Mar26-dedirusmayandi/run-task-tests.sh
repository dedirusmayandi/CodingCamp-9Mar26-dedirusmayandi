#!/bin/bash
# Simple script to run task property tests

echo "Running TaskList Property-Based Tests..."
npx vitest run tests/properties/task-properties.test.js --reporter=verbose
