# Donkey Type - Typing Practice Website MVP

A typing practice and racing website similar to Monkeytype, built with Spring Boot backend and React + TypeScript frontend.

## Project Structure

```
donkey-type/
├── backend/          # Spring Boot application
└── frontend/         # React + TypeScript application
```

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database (in-memory)
- Maven

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Node.js 18+ and npm

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build and run the Spring Boot application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Features

### ✅ Implemented

1. **Typing Practice Mode**
   - Display random text samples
   - Real-time WPM, accuracy, and error tracking
   - Visual feedback for correct/incorrect characters
   - Automatic test completion detection

2. **User System**
   - User registration and login
   - User statistics tracking (best WPM, average accuracy)
   - Typing history storage

3. **Leaderboard**
   - Top users by best WPM
   - Top users by average accuracy
   - Global leaderboard display

4. **UI Pages**
   - Home page with practice button and leaderboard preview
   - Practice page with typing interface
   - Leaderboard page
   - Login and Register pages

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Typing
- `GET /api/typing/text` - Get random typing text
- `POST /api/typing/submit/{userId}` - Submit typing test results

### Leaderboard
- `GET /api/leaderboard/wpm?limit={n}` - Get top users by WPM
- `GET /api/leaderboard/accuracy?limit={n}` - Get top users by accuracy

## Notes

- **Password Security**: In the MVP, passwords are stored in plain text. For production, implement password hashing (e.g., BCrypt).
- **Authentication**: Currently, userId is passed as a path parameter. In production, implement proper session/token-based authentication.
- **Database**: Using H2 in-memory database. Data will be lost on restart. For production, use a persistent database like PostgreSQL.

## Development

### Backend
- Main application: `backend/src/main/java/com/donkeytype/DonkeyTypeApplication.java`
- Controllers: `backend/src/main/java/com/donkeytype/controller/`
- Services: `backend/src/main/java/com/donkeytype/service/`
- Entities: `backend/src/main/java/com/donkeytype/entity/`

### Frontend
- Entry point: `frontend/src/main.tsx`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- Services: `frontend/src/services/api.ts`
- Typing engine: `frontend/src/utils/typingEngine.ts`

## License

This is an MVP project for educational purposes.

