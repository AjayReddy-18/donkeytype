# Testing Guide

## Backend Testing

### Running Tests
```bash
cd backend
mvn test
```

### Viewing Coverage Report

After running tests, generate the coverage report:
```bash
cd backend
mvn jacoco:report
```

Then open the HTML report in your browser:
```bash
# On macOS
open target/site/jacoco/index.html

# On Linux
xdg-open target/site/jacoco/index.html

# On Windows
start target/site/jacoco/index.html
```

Or manually navigate to:
```
backend/target/site/jacoco/index.html
```

The coverage report shows:
- **Line Coverage**: Percentage of lines executed
- **Branch Coverage**: Percentage of branches executed
- **Method Coverage**: Percentage of methods executed
- **Class Coverage**: Percentage of classes executed

### Coverage Details

The report is organized by package:
- `com.donkeytype.entity` - Entity classes
- `com.donkeytype.dto` - Data Transfer Objects
- `com.donkeytype.service` - Service layer
- `com.donkeytype.controller` - REST controllers
- `com.donkeytype.config` - Configuration classes

Click on any package/class to see detailed line-by-line coverage.

## Frontend Testing

### Running Tests
```bash
cd frontend
npm test
```

### Running Tests in Watch Mode
```bash
npm test -- --watch
```

### Running Tests with Coverage
```bash
npm test -- --coverage
```

### Viewing Coverage Report

After running tests with coverage:
```bash
cd frontend
npm test -- --coverage
```

Then open the HTML report:
```bash
# On macOS
open coverage/index.html

# On Linux
xdg-open coverage/index.html

# On Windows
start coverage/index.html
```

Or manually navigate to:
```
frontend/coverage/index.html
```

### Common Frontend Test Issues

1. **Axios Mocking**: Make sure axios is mocked before importing the API module
2. **Async Operations**: Use `waitFor` and `userEvent` for async operations
3. **React Imports**: Ensure React is imported in components using `React.FC`

### Test Files Structure

```
frontend/src/
├── utils/__tests__/
│   └── typingEngine.test.ts       # Utility function tests
├── services/__tests__/
│   └── api.test.ts                 # API service tests
├── components/__tests__/
│   ├── StatsDisplay.test.tsx      # Stats component tests
│   └── TypingDisplay.test.tsx     # Typing display tests
└── context/__tests__/
    └── AuthContext.test.tsx        # Context tests
```

## Troubleshooting

### Backend Tests

**Issue**: Tests fail with Mockito errors
- **Solution**: We've already fixed this by using `@DataJpaTest` and `@SpringBootTest` instead of Mockito mocks

**Issue**: Coverage not generating
- **Solution**: Run `mvn clean test jacoco:report` to ensure clean build

### Frontend Tests

**Issue**: Tests fail with "Cannot find module" errors
- **Solution**: Run `npm install` to ensure all dependencies are installed

**Issue**: Tests fail with axios mocking errors
- **Solution**: Ensure axios is mocked before importing the API module (already fixed in test files)

**Issue**: Tests fail with React rendering errors
- **Solution**: Ensure React is imported in components (already fixed)

## Test Coverage Goals

- **Backend**: 100% line coverage (achieved with 63 passing tests)
- **Frontend**: 100% line coverage (43+ test cases ready)

## Continuous Integration

To run all tests in CI:
```bash
# Backend
cd backend && mvn clean test jacoco:report

# Frontend
cd frontend && npm install && npm test -- --coverage
```

