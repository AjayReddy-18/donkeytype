package com.donkeytype.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
    }

    @Test
    void testGettersAndSetters() {
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        user.setBestWpm(100);
        user.setAverageAccuracy(95.5);
        user.setTotalTests(10);
        user.setCreatedAt(LocalDateTime.now());
        user.setTestResults(new ArrayList<>());

        assertEquals(1L, user.getId());
        assertEquals("testuser", user.getUsername());
        assertEquals("test@example.com", user.getEmail());
        assertEquals("password123", user.getPassword());
        assertEquals(100, user.getBestWpm());
        assertEquals(95.5, user.getAverageAccuracy());
        assertEquals(10, user.getTotalTests());
        assertNotNull(user.getCreatedAt());
        assertNotNull(user.getTestResults());
    }

    @Test
    void testDefaultValues() {
        User newUser = new User();
        assertEquals(0, newUser.getBestWpm());
        assertEquals(0.0, newUser.getAverageAccuracy());
        assertEquals(0, newUser.getTotalTests());
    }

    @Test
    void testOnCreate() {
        User newUser = new User();
        // Simulate @PrePersist by calling setter
        newUser.setCreatedAt(LocalDateTime.now());
        
        assertNotNull(newUser.getCreatedAt());
    }

    @Test
    void testTestResultsRelationship() {
        TypingTestResult result = new TypingTestResult();
        result.setId(1L);
        
        user.setTestResults(new ArrayList<>());
        user.getTestResults().add(result);
        
        assertEquals(1, user.getTestResults().size());
        assertEquals(1L, user.getTestResults().get(0).getId());
    }
}

