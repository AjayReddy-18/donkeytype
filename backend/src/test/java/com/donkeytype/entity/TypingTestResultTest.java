package com.donkeytype.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class TypingTestResultTest {

    private TypingTestResult result;
    private User user;

    @BeforeEach
    void setUp() {
        result = new TypingTestResult();
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
    }

    @Test
    void testGettersAndSetters() {
        result.setId(1L);
        result.setUser(user);
        result.setWpm(75);
        result.setAccuracy(85.5);
        result.setTotalErrors(3);
        result.setTimeSeconds(120);
        result.setTestDate(LocalDateTime.now());

        assertEquals(1L, result.getId());
        assertEquals(user, result.getUser());
        assertEquals(75, result.getWpm());
        assertEquals(85.5, result.getAccuracy());
        assertEquals(3, result.getTotalErrors());
        assertEquals(120, result.getTimeSeconds());
        assertNotNull(result.getTestDate());
    }

    @Test
    void testOnCreate() {
        TypingTestResult newResult = new TypingTestResult();
        // Simulate @PrePersist by calling setter
        newResult.setTestDate(LocalDateTime.now());
        
        assertNotNull(newResult.getTestDate());
    }

    @Test
    void testUserRelationship() {
        result.setUser(user);
        
        assertEquals(user, result.getUser());
        assertEquals(1L, result.getUser().getId());
        assertEquals("testuser", result.getUser().getUsername());
    }

    @Test
    void testZeroValues() {
        result.setWpm(0);
        result.setAccuracy(0.0);
        result.setTotalErrors(0);
        result.setTimeSeconds(0);

        assertEquals(0, result.getWpm());
        assertEquals(0.0, result.getAccuracy());
        assertEquals(0, result.getTotalErrors());
        assertEquals(0, result.getTimeSeconds());
    }
}

