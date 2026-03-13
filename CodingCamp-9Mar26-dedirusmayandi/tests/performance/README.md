# Performance Tests

This directory contains performance tests for the Productivity Dashboard application.

## Overview

The performance test suite validates that the application meets the performance requirements specified in the requirements document:

- **Requirement 5.2**: Save task data to Local Storage within 100ms
- **Requirement 5.3**: Save link data to Local Storage within 100ms
- **Requirement 6.2**: Complete initial page load within 1 second
- **Requirement 6.3**: Update task display within 100ms
- **Requirement 6.4**: Update link display within 100ms
- **Requirement 6.5**: Maintain 60fps during UI animations (16.67ms per frame)

## Test Structure

### Initial Page Load Performance
Tests that the application loads and initializes all components within 1 second.

### Task Operations Performance
- Adding tasks completes within 100ms
- Editing tasks completes within 100ms
- Deleting tasks completes within 100ms
- Storage save operations complete within 100ms

### Quick Links Operations Performance
- Adding links completes within 100ms
- Deleting links completes within 100ms
- Storage save operations complete within 100ms

### UI Animation Performance
- DOM updates complete within 16.67ms (60fps frame budget)
- Task completion toggles are smooth
- Link additions are smooth

### Storage Performance Under Load
- Multiple rapid task additions handled efficiently
- Multiple rapid link additions handled efficiently
- Large datasets load quickly (under 500ms for 100 items)

### Memory and Resource Efficiency
- No memory leaks during repeated add/delete cycles
- Clean state after operations

## Running the Tests

```bash
# Run all performance tests
npm test tests/performance/performance.test.js

# Or use the provided script
./run-performance-tests.sh

# Run with verbose output
npx vitest run tests/performance/performance.test.js --reporter=verbose
```

## Performance Metrics

All timing measurements use `performance.now()` for high-resolution timing.

### Target Metrics
- Page load: < 1000ms
- Task operations: < 100ms
- Link operations: < 100ms
- Storage saves: < 100ms
- DOM updates: < 16.67ms (60fps)

## Notes

- Tests run in a JSDOM environment which simulates browser behavior
- Actual browser performance may vary based on hardware and browser engine
- These tests provide baseline performance validation
- For real-world performance testing, use browser-based tools like Lighthouse or WebPageTest
