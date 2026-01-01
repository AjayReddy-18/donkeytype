package com.donkeytype.service;

import com.donkeytype.dto.RegisterRequest;
import com.donkeytype.dto.UserResponse;
import com.donkeytype.entity.User;
import com.donkeytype.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import(UserService.class)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
    }

    @Test
    void testRegister_Success() {
        UserResponse response = userService.register(registerRequest);

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(0, response.getBestWpm());
        assertEquals(0.0, response.getAverageAccuracy());
        assertEquals(0, response.getTotalTests());
        
        // Verify user was saved
        User savedUser = userRepository.findByUsername("testuser").orElse(null);
        assertNotNull(savedUser);
        assertEquals("test@example.com", savedUser.getEmail());
    }

    @Test
    void testRegister_UsernameAlreadyExists() {
        // Create existing user
        User existingUser = new User();
        existingUser.setUsername("testuser");
        existingUser.setEmail("existing@example.com");
        existingUser.setPassword("password");
        entityManager.persistAndFlush(existingUser);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.register(registerRequest)
        );

        assertEquals("Username already exists", exception.getMessage());
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        // Create existing user with same email
        User existingUser = new User();
        existingUser.setUsername("otheruser");
        existingUser.setEmail("test@example.com");
        existingUser.setPassword("password");
        entityManager.persistAndFlush(existingUser);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.register(registerRequest)
        );

        assertEquals("Email already exists", exception.getMessage());
    }

    @Test
    void testLogin_Success() {
        // Create user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        entityManager.persistAndFlush(user);

        UserResponse response = userService.login("testuser", "password123");

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
    }

    @Test
    void testLogin_UserNotFound() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.login("nonexistent", "password123")
        );

        assertEquals("Invalid username or password", exception.getMessage());
    }

    @Test
    void testLogin_WrongPassword() {
        // Create user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        entityManager.persistAndFlush(user);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.login("testuser", "wrongpassword")
        );

        assertEquals("Invalid username or password", exception.getMessage());
    }

    @Test
    void testGetUserById_Success() {
        // Create user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        entityManager.persistAndFlush(user);

        UserResponse response = userService.getUserById(user.getId());

        assertNotNull(response);
        assertEquals(user.getId(), response.getId());
        assertEquals("testuser", response.getUsername());
    }

    @Test
    void testGetUserById_NotFound() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.getUserById(999L)
        );

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void testUpdateUserStats_NewBestWpm() {
        // Create user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        user.setBestWpm(50);
        user.setAverageAccuracy(80.0);
        user.setTotalTests(5);
        entityManager.persistAndFlush(user);

        userService.updateUserStats(user.getId(), 75, 85.0);

        User updatedUser = userRepository.findById(user.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals(75, updatedUser.getBestWpm());
        assertEquals(6, updatedUser.getTotalTests());
    }

    @Test
    void testUpdateUserStats_NoNewBestWpm() {
        // Create user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        user.setBestWpm(100);
        user.setAverageAccuracy(90.0);
        user.setTotalTests(10);
        entityManager.persistAndFlush(user);

        userService.updateUserStats(user.getId(), 75, 85.0);

        User updatedUser = userRepository.findById(user.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals(100, updatedUser.getBestWpm()); // Should remain 100
        assertEquals(11, updatedUser.getTotalTests());
    }

    @Test
    void testUpdateUserStats_FirstTest() {
        // Create user
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password123");
        user.setBestWpm(0);
        user.setAverageAccuracy(0.0);
        user.setTotalTests(0);
        entityManager.persistAndFlush(user);

        userService.updateUserStats(user.getId(), 60, 95.0);

        User updatedUser = userRepository.findById(user.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals(60, updatedUser.getBestWpm());
        assertEquals(95.0, updatedUser.getAverageAccuracy());
        assertEquals(1, updatedUser.getTotalTests());
    }

    @Test
    void testUpdateUserStats_UserNotFound() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.updateUserStats(999L, 60, 95.0)
        );

        assertEquals("User not found", exception.getMessage());
    }
}
