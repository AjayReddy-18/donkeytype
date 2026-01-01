# Quick Start Guide

## Backend (Spring Boot)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```
   
   The backend will be available at `http://localhost:8080`

3. **Access H2 Console (optional):**
   - Navigate to `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:donkeytype`
   - Username: `sa`
   - Password: (leave empty)

## Frontend (React)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:3000`

## Testing the Application

1. **Register a new user:**
   - Go to `http://localhost:3000/register`
   - Fill in username, email, and password
   - Click Register

2. **Start practicing:**
   - After registration/login, you'll be redirected to the practice page
   - Start typing the displayed text
   - Watch your WPM, accuracy, and errors update in real-time

3. **View leaderboard:**
   - Navigate to the Leaderboard page
   - Switch between "Top WPM" and "Top Accuracy" views

## Troubleshooting

- **Backend won't start:** Make sure Java 17+ is installed and Maven is configured
- **Frontend won't start:** Make sure Node.js 18+ is installed
- **CORS errors:** Ensure backend is running on port 8080 and frontend on port 3000
- **API errors:** Check browser console and backend logs for detailed error messages

