package com.donkeytype.controller;

import com.donkeytype.dto.SubmitResultRequest;
import com.donkeytype.entity.User;
import com.donkeytype.repository.UserRepository;
import com.donkeytype.repository.TypingTestResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class TypingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TypingTestResultRepository resultRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private SubmitResultRequest submitRequest;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        resultRepository.deleteAll();
        
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser = userRepository.save(testUser);

        submitRequest = new SubmitResultRequest();
        submitRequest.setWpm(75);
        submitRequest.setAccuracy(85.5);
        submitRequest.setTotalErrors(3);
        submitRequest.setTimeSeconds(120);
    }

    @Test
    void testGetText_Success() throws Exception {
        mockMvc.perform(get("/api/typing/text"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").exists())
                .andExpect(jsonPath("$.wordCount").exists());
    }

    @Test
    void testSubmitResult_Success() throws Exception {
        mockMvc.perform(post("/api/typing/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Result submitted successfully"));
    }

    @Test
    void testSubmitResult_UserNotFound() throws Exception {
        mockMvc.perform(post("/api/typing/submit/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void testSubmitResult_InvalidRequest() throws Exception {
        SubmitResultRequest invalidRequest = new SubmitResultRequest();
        invalidRequest.setWpm(null); // Invalid

        mockMvc.perform(post("/api/typing/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitResult_ZeroWpm() throws Exception {
        submitRequest.setWpm(0);
        mockMvc.perform(post("/api/typing/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(submitRequest)))
                .andExpect(status().isOk());
    }
}
