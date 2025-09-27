# Testing Guide

This document describes the comprehensive testing setup for the Capacitator Sprint Planning Calculator.

## Overview

The project uses **Jest** as the primary testing framework with **TypeScript** support and **jsdom** for DOM testing. We have three types of tests:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test UI interactions and component integration
3. **Browser Tests** - Manual testing using the test.html page

## Test Structure

```
tests/
├── setup.ts                    # Jest configuration and mocks
├── unit/                       # Unit tests
│   ├── calculations.test.ts     # SprintCalculator utility tests
│   ├── renderer.test.ts         # CapacitatorRenderer logic tests
│   └── fileOperations.test.ts   # File save/load operation tests
└── integration/                 # Integration tests
    └── ui-interactions.test.ts  # UI interaction and DOM tests
```

## Running Tests

### Basic Commands

```bash
# Run all unit tests
make test

# Run tests with coverage report
make test-coverage

# Run tests in watch mode (auto-rerun on file changes)
make test-watch

# Run browser-based integration tests
make test-browser

# Run all tests (unit + browser)
make test-all
```

### npm Commands

```bash
# Direct npm commands
npm test                # Run Jest tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

## Test Coverage

The tests provide comprehensive coverage of all core functionality:

### SprintCalculator Utilities (100% Coverage)
- ✅ Sprint day calculations (working days, weekends excluded)
- ✅ Team capacity calculations
- ✅ Story point distribution
- ✅ Individual capacity allocation
- ✅ Low availability detection
- ✅ Edge cases (invalid dates, zero values, rounding)

### CapacitatorRenderer Logic
- ✅ State management
- ✅ Team member CRUD operations
- ✅ Calculation integration
- ✅ Template loading/saving
- ✅ Error handling

### File Operations
- ✅ Template save functionality
- ✅ Template load functionality
- ✅ Dialog interactions
- ✅ Error handling (file errors, invalid JSON)
- ✅ User cancellation scenarios

### UI Interactions
- ✅ Button click handlers
- ✅ Form input updates
- ✅ Table row management
- ✅ Modal show/hide
- ✅ Loading indicator states
- ✅ DOM element updates

## Test Features

### Mocking
- **electronAPI**: Mocked for template operations
- **File System**: Mocked for save/load operations
- **DOM Elements**: Created programmatically for testing
- **Console**: Suppressable for clean test output

### Test Utilities
```typescript
// From tests/setup.ts
import { mockElectronAPI, suppressConsole, restoreConsole } from '../setup';

// Mock date for consistent testing
mockDate('2025-09-27T00:00:00');

// Suppress console output during tests
suppressConsole();
```

### Assertions
- **Calculation Accuracy**: Verify mathematical operations
- **State Management**: Ensure proper state updates
- **DOM Manipulation**: Check element creation/updates
- **Error Handling**: Validate error scenarios
- **User Interactions**: Test event handling

## Key Test Cases

### Date Calculations
```typescript
it('should calculate working days correctly excluding weekends', () => {
  const startDate = new Date('2025-09-27T00:00:00'); // Saturday
  const endDate = new Date('2025-10-15T00:00:00');   // Wednesday

  const result = SprintCalculator.calculateSprintDays(startDate, endDate);

  expect(result).toBe(13); // 13 working days
});
```

### Team Management
```typescript
it('should add team member when Add Member button is clicked', () => {
  const addButton = document.getElementById('addMemberBtn');

  addButton.click();

  expect(renderer.state.sprint.teamMembers).toHaveLength(1);
  expect(teamTableBody.children.length).toBe(1);
});
```

### Template Operations
```typescript
it('should save template successfully when user selects file', async () => {
  mockDialog.showSaveDialog.mockResolvedValue({
    canceled: false,
    filePath: '/Users/test/template.json'
  });

  const result = await saveSprintTemplate(mockTemplate);

  expect(result).toEqual({ success: true });
});
```

## Coverage Report

Run `make test-coverage` to generate detailed coverage reports:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Terminal Output**: Shows file-by-file coverage percentages
- **LCOV Format**: `coverage/lcov.info` for CI integration

## Test Environment

### Configuration (package.json)
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/main.ts"
    ]
  }
}
```

### Mock Setup
- **electronAPI**: Provides mock save/load operations
- **DOM Environment**: jsdom for browser-like testing
- **TypeScript**: Full type checking in tests
- **Global Mocks**: Consistent across all test suites

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Tests explain what they verify
3. **Edge Cases**: Test boundary conditions
4. **Mocking**: Isolate units under test
5. **Clean State**: Reset between tests

### Mock Strategy
- Mock external dependencies (Electron, file system)
- Keep business logic pure and testable
- Use real calculations where possible
- Mock UI interactions for integration tests

### Coverage Goals
- **Utilities**: 100% (critical business logic)
- **Components**: 80%+ (UI interaction logic)
- **Integration**: Key user workflows covered
- **Edge Cases**: Error scenarios tested

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    npm ci
    npm test
    npm run test:coverage
```

## Browser Testing

For manual testing and debugging:

1. Run `make test-browser` to open test.html
2. Interactive testing environment with:
   - Real DOM interactions
   - Visual feedback
   - Console logging
   - Mock electronAPI

## Debugging Tests

### VSCode Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Common Issues
- **DOM Elements**: Ensure all required elements exist
- **Async Operations**: Use proper async/await patterns
- **Mocks**: Clear mocks between tests
- **TypeScript**: Address type safety warnings

## Future Enhancements

- **E2E Tests**: Playwright/Puppeteer for full application testing
- **Performance Tests**: Measure calculation performance
- **Visual Tests**: Screenshot comparison testing
- **Accessibility**: A11y testing integration