package com.donkeytype.controller;

import com.donkeytype.entity.User;
import com.donkeytype.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration"
})
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
class LeaderboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        
        User user1 = new User();
        user1.setUsername("user1");
        user1.setEmail("user1@example.com");
        user1.setPassword("password");
        user1.setBestWpm(100);
        user1.setAverageAccuracy(95.5);
        user1.setTotalTests(10);
        userRepository.save(user1);

        User user2 = new User();
        user2.setUsername("user2");
        user2.setEmail("user2@example.com");
        user2.setPassword("password");
        user2.setBestWpm(80);
        user2.setAverageAccuracy(90.0);
        user2.setTotalTests(10);
        userRepository.save(user2);
    }

    @Test
    void testGetTopByWpm_Success() throws Exception {
        mockMvc.perform(get("/api/leaderboard/wpm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("user1"))
                .andExpect(jsonPath("$[0].bestWpm").value(100))
                .andExpect(jsonPath("$[0].averageAccuracy").value(95.5))
                .andExpect(jsonPath("$[1].username").value("user2"))
                .andExpect(jsonPath("$[1].bestWpm").value(80));
    }

    @Test
    void testGetTopByWpm_WithCustomLimit() throws Exception {
        mockMvc.perform(get("/api/leaderboard/wpm?limit=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("user1"));
    }

    @Test
    void testGetTopByWpm_EmptyList() throws Exception {
        userRepository.deleteAll();
        
        mockMvc.perform(get("/api/leaderboard/wpm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void testGetTopByAccuracy_Success() throws Exception {
        mockMvc.perform(get("/api/leaderboard/accuracy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("user1"))
                .andExpect(jsonPath("$[0].averageAccuracy").value(95.5))
                .andExpect(jsonPath("$[1].username").value("user2"))
                .andExpect(jsonPath("$[1].averageAccuracy").value(90.0));
    }

    @Test
    void testGetTopByAccuracy_WithCustomLimit() throws Exception {
        mockMvc.perform(get("/api/leaderboard/accuracy?limit=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("user1"));
    }

    @Test
    void testGetTopByAccuracy_EmptyList() throws Exception {
        userRepository.deleteAll();
        
        mockMvc.perform(get("/api/leaderboard/accuracy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
