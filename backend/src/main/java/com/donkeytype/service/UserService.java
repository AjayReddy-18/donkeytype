package com.donkeytype.service;

import com.donkeytype.dto.RegisterRequest;
import com.donkeytype.dto.UserResponse;
import com.donkeytype.entity.User;
import com.donkeytype.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service layer for user operations
 */
@Service
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    
    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Register a new user
     * Note: In production, password should be hashed (e.g., using BCrypt)
     * For MVP, storing plain text password is acceptable but not secure
     */
    public UserResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }
        
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        // TODO: Hash password in production
        user.setPassword(request.getPassword());
        user.setBestWpm(0);
        user.setAverageAccuracy(0.0);
        user.setTotalTests(0);
        
        User savedUser = userRepository.save(user);
        return convertToResponse(savedUser);
    }
    
    /**
     * Authenticate user login
     * Note: In production, use proper password hashing and comparison
     */
    public UserResponse login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        
        User user = userOpt.get();
        // TODO: Use password hashing comparison in production
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        
        return convertToResponse(user);
    }
    
    /**
     * Get user by ID
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return convertToResponse(user);
    }
    
    /**
     * Update user stats after a typing test
     */
    public void updateUserStats(Long userId, Integer wpm, Double accuracy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Update best WPM if current test is better
        if (wpm > user.getBestWpm()) {
            user.setBestWpm(wpm);
        }
        
        // Update average accuracy
        int totalTests = user.getTotalTests();
        double currentAvg = user.getAverageAccuracy();
        double newAvg = ((currentAvg * totalTests) + accuracy) / (totalTests + 1);
        user.setAverageAccuracy(newAvg);
        user.setTotalTests(totalTests + 1);
        
        userRepository.save(user);
    }
    
    /**
     * Convert User entity to UserResponse DTO
     */
    private UserResponse convertToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBestWpm(),
                user.getAverageAccuracy(),
                user.getTotalTests()
        );
    }
}

