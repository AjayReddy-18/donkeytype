package com.donkeytype.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DtoTest {

    @Test
    void testUserResponse() {
        UserResponse response = new UserResponse(1L, "testuser", "test@example.com", 100, 95.5, 10);

        assertEquals(1L, response.getId());
        assertEquals("testuser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(100, response.getBestWpm());
        assertEquals(95.5, response.getAverageAccuracy());
        assertEquals(10, response.getTotalTests());

        // Test setters
        response.setId(2L);
        response.setUsername("newuser");
        response.setEmail("new@example.com");
        response.setBestWpm(120);
        response.setAverageAccuracy(98.0);
        response.setTotalTests(20);

        assertEquals(2L, response.getId());
        assertEquals("newuser", response.getUsername());
        assertEquals("new@example.com", response.getEmail());
        assertEquals(120, response.getBestWpm());
        assertEquals(98.0, response.getAverageAccuracy());
        assertEquals(20, response.getTotalTests());
    }

    @Test
    void testUserResponse_DefaultConstructor() {
        UserResponse response = new UserResponse();
        assertNotNull(response);
    }

    @Test
    void testRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password123");

        assertEquals("testuser", request.getUsername());
        assertEquals("test@example.com", request.getEmail());
        assertEquals("password123", request.getPassword());
    }

    @Test
    void testLoginRequest() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        assertEquals("testuser", request.getUsername());
        assertEquals("password123", request.getPassword());
    }

    @Test
    void testTypingTextResponse() {
        TypingTextResponse response = new TypingTextResponse("Test text", 2);

        assertEquals("Test text", response.getText());
        assertEquals(2, response.getWordCount());

        response.setText("New text");
        response.setWordCount(2);

        assertEquals("New text", response.getText());
        assertEquals(2, response.getWordCount());
    }

    @Test
    void testTypingTextResponse_DefaultConstructor() {
        TypingTextResponse response = new TypingTextResponse();
        assertNotNull(response);
    }

    @Test
    void testSubmitResultRequest() {
        SubmitResultRequest request = new SubmitResultRequest();
        request.setWpm(75);
        request.setAccuracy(85.5);
        request.setTotalErrors(3);
        request.setTimeSeconds(120);

        assertEquals(75, request.getWpm());
        assertEquals(85.5, request.getAccuracy());
        assertEquals(3, request.getTotalErrors());
        assertEquals(120, request.getTimeSeconds());
    }

    @Test
    void testLeaderboardEntry() {
        LeaderboardEntry entry = new LeaderboardEntry("user1", 100, 95.5);

        assertEquals("user1", entry.getUsername());
        assertEquals(100, entry.getBestWpm());
        assertEquals(95.5, entry.getAverageAccuracy());

        entry.setUsername("user2");
        entry.setBestWpm(120);
        entry.setAverageAccuracy(98.0);

        assertEquals("user2", entry.getUsername());
        assertEquals(120, entry.getBestWpm());
        assertEquals(98.0, entry.getAverageAccuracy());
    }

    @Test
    void testLeaderboardEntry_DefaultConstructor() {
        LeaderboardEntry entry = new LeaderboardEntry();
        assertNotNull(entry);
    }
}

