package com.donkeytype.service;

import com.donkeytype.dto.SubmitResultRequest;
import com.donkeytype.entity.TypingTestResult;
import com.donkeytype.entity.User;
import com.donkeytype.repository.TypingTestResultRepository;
import com.donkeytype.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({TypingTestService.class, UserService.class})
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TypingTestServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TypingTestResultRepository resultRepository;

    @Autowired
    private TypingTestService typingTestService;

    private User testUser;
    private SubmitResultRequest submitRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setBestWpm(50);
        testUser.setAverageAccuracy(80.0);
        testUser.setTotalTests(5);
        entityManager.persistAndFlush(testUser);

        submitRequest = new SubmitResultRequest();
        submitRequest.setWpm(75);
        submitRequest.setAccuracy(85.5);
        submitRequest.setTotalErrors(3);
        submitRequest.setTimeSeconds(120);
    }

    @Test
    void testSubmitResult_Success() {
        typingTestService.submitResult(testUser.getId(), submitRequest);

        entityManager.flush();
        entityManager.clear();
        
        List<TypingTestResult> results = resultRepository.findAll();
        assertEquals(1, results.size());
        
        TypingTestResult savedResult = results.get(0);
        assertEquals(testUser.getId(), savedResult.getUser().getId());
        assertEquals(75, savedResult.getWpm());
        assertEquals(85.5, savedResult.getAccuracy());
        assertEquals(3, savedResult.getTotalErrors());
        assertEquals(120, savedResult.getTimeSeconds());
        
        // Verify user stats were updated
        User updatedUser = userRepository.findById(testUser.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals(75, updatedUser.getBestWpm());
        assertEquals(6, updatedUser.getTotalTests());
    }

    @Test
    void testSubmitResult_UserNotFound() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> typingTestService.submitResult(999L, submitRequest)
        );

        assertEquals("User not found", exception.getMessage());
        
        List<TypingTestResult> results = resultRepository.findAll();
        assertEquals(0, results.size());
    }

    @Test
    void testSubmitResult_ZeroWpm() {
        submitRequest.setWpm(0);
        typingTestService.submitResult(testUser.getId(), submitRequest);

        entityManager.flush();
        entityManager.clear();
        
        List<TypingTestResult> results = resultRepository.findAll();
        assertEquals(1, results.size());
        assertEquals(0, results.get(0).getWpm());
        
        // Verify user stats - with 0 WPM, bestWpm should remain 50 (since 0 < 50)
        User updatedUser = userRepository.findById(testUser.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals(50, updatedUser.getBestWpm()); // Should remain 50 since 0 is not > 50
        assertEquals(6, updatedUser.getTotalTests());
    }

    @Test
    void testSubmitResult_ZeroAccuracy() {
        submitRequest.setAccuracy(0.0);
        typingTestService.submitResult(testUser.getId(), submitRequest);

        List<TypingTestResult> results = resultRepository.findAll();
        assertEquals(1, results.size());
        assertEquals(0.0, results.get(0).getAccuracy());
    }
}
