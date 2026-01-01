package com.donkeytype.service;

import com.donkeytype.dto.LeaderboardEntry;
import com.donkeytype.entity.User;
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
@Import(LeaderboardService.class)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class LeaderboardServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaderboardService leaderboardService;

    private User user1;
    private User user2;
    private User user3;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setUsername("user1");
        user1.setEmail("user1@example.com");
        user1.setPassword("password");
        user1.setBestWpm(100);
        user1.setAverageAccuracy(95.5);
        user1.setTotalTests(10);
        entityManager.persistAndFlush(user1);

        user2 = new User();
        user2.setUsername("user2");
        user2.setEmail("user2@example.com");
        user2.setPassword("password");
        user2.setBestWpm(80);
        user2.setAverageAccuracy(90.0);
        user2.setTotalTests(10);
        entityManager.persistAndFlush(user2);

        user3 = new User();
        user3.setUsername("user3");
        user3.setEmail("user3@example.com");
        user3.setPassword("password");
        user3.setBestWpm(60);
        user3.setAverageAccuracy(85.0);
        user3.setTotalTests(10);
        entityManager.persistAndFlush(user3);
    }

    @Test
    void testGetTopByWpm_Success() {
        List<LeaderboardEntry> entries = leaderboardService.getTopByWpm(10);

        assertNotNull(entries);
        assertEquals(3, entries.size());
        assertEquals("user1", entries.get(0).getUsername());
        assertEquals(100, entries.get(0).getBestWpm());
        assertEquals(95.5, entries.get(0).getAverageAccuracy());
    }

    @Test
    void testGetTopByWpm_WithLimit() {
        List<LeaderboardEntry> entries = leaderboardService.getTopByWpm(2);

        assertNotNull(entries);
        assertEquals(2, entries.size());
        assertEquals("user1", entries.get(0).getUsername());
        assertEquals("user2", entries.get(1).getUsername());
    }

    @Test
    void testGetTopByWpm_EmptyList() {
        // Clear all users
        userRepository.deleteAll();
        entityManager.flush();

        List<LeaderboardEntry> entries = leaderboardService.getTopByWpm(10);

        assertNotNull(entries);
        assertTrue(entries.isEmpty());
    }

    @Test
    void testGetTopByAccuracy_Success() {
        List<LeaderboardEntry> entries = leaderboardService.getTopByAccuracy(10);

        assertNotNull(entries);
        assertEquals(3, entries.size());
        assertEquals("user1", entries.get(0).getUsername());
        assertEquals(95.5, entries.get(0).getAverageAccuracy());
    }

    @Test
    void testGetTopByAccuracy_WithLimit() {
        List<LeaderboardEntry> entries = leaderboardService.getTopByAccuracy(1);

        assertNotNull(entries);
        assertEquals(1, entries.size());
        assertEquals("user1", entries.get(0).getUsername());
    }

    @Test
    void testGetTopByAccuracy_EmptyList() {
        // Clear all users
        userRepository.deleteAll();
        entityManager.flush();

        List<LeaderboardEntry> entries = leaderboardService.getTopByAccuracy(10);

        assertNotNull(entries);
        assertTrue(entries.isEmpty());
    }
}
