# Testing Documentation

This project follows Test-Driven Development (TDD) principles with comprehensive test coverage.

## Backend Testing

### Setup
- **Framework**: JUnit 5
- **Mocking**: Mockito
- **Coverage**: JaCoCo (configured for 100% coverage requirement)

### Running Backend Tests
```bash
cd backend
mvn test
```

### Coverage Report
```bash
mvn test jacoco:report
```
Coverage report will be generated in `backend/target/site/jacoco/index.html`

### Test Structure

#### Service Tests
- `UserServiceTest.java` - Tests for user registration, login, stats updates
- `TypingTextServiceTest.java` - Tests for random text generation
- `TypingTestServiceTest.java` - Tests for submitting typing results
- `LeaderboardServiceTest.java` - Tests for leaderboard queries

#### Controller Tests
- `AuthControllerTest.java` - Tests for authentication endpoints
- `TypingControllerTest.java` - Tests for typing endpoints
- `LeaderboardControllerTest.java` - Tests for leaderboard endpoints

#### Entity Tests
- `UserTest.java` - Tests for User entity
- `TypingTestResultTest.java` - Tests for TypingTestResult entity

#### DTO Tests
- `DtoTest.java` - Tests for all DTOs (RegisterRequest, LoginRequest, etc.)

## Frontend Testing

### Setup
- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Coverage**: @vitest/coverage-v8

### Installing Dependencies
```bash
cd frontend
npm install
```

### Running Frontend Tests
```bash
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Test Structure

#### Utility Tests
- `typingEngine.test.ts` - Tests for WPM calculation, accuracy, text comparison, character status

#### Service Tests
- `api.test.ts` - Tests for API client functions (mocked axios)

#### Component Tests
- `StatsDisplay.test.tsx` - Tests for stats display component
- `TypingDisplay.test.tsx` - Tests for typing display component

#### Context Tests
- `AuthContext.test.tsx` - Tests for authentication context

## Coverage Goals

- **Backend**: 100% line coverage (enforced by JaCoCo)
- **Frontend**: 100% coverage for all utilities, services, and components

## Test Coverage Details

### Backend Coverage
- All service methods tested (success and error cases)
- All controller endpoints tested (valid and invalid requests)
- All entity getters/setters tested
- All DTO constructors and methods tested
- Edge cases and boundary conditions covered

### Frontend Coverage
- All utility functions tested with various inputs
- All API service methods tested (mocked)
- All React components tested for rendering
- All context providers tested for state management
- Edge cases and error handling covered

## Running All Tests

### Backend
```bash
cd backend
mvn clean test
```

### Frontend
```bash
cd frontend
npm test -- --run
```

## Continuous Integration

Tests should be run:
- Before every commit
- In CI/CD pipeline
- Coverage reports should be generated and checked

## Notes

- Backend tests use Mockito for mocking dependencies
- Frontend tests use Vitest with jsdom environment
- All tests follow AAA pattern (Arrange, Act, Assert)
- Tests are isolated and independent
- Mock data is used to avoid external dependencies

