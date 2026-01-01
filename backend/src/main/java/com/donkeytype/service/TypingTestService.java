package com.donkeytype.service;

import com.donkeytype.dto.SubmitResultRequest;
import com.donkeytype.entity.TypingTestResult;
import com.donkeytype.entity.User;
import com.donkeytype.repository.TypingTestResultRepository;
import com.donkeytype.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling typing test results
 */
@Service
@Transactional
public class TypingTestService {
    
    private final TypingTestResultRepository resultRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    
    @Autowired
    public TypingTestService(TypingTestResultRepository resultRepository,
                            UserRepository userRepository,
                            UserService userService) {
        this.resultRepository = resultRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }
    
    /**
     * Save typing test result and update user statistics
     */
    public void submitResult(Long userId, SubmitResultRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Save the test result
        TypingTestResult result = new TypingTestResult();
        result.setUser(user);
        result.setWpm(request.getWpm());
        result.setAccuracy(request.getAccuracy());
        result.setTotalErrors(request.getTotalErrors());
        result.setTimeSeconds(request.getTimeSeconds());
        
        resultRepository.save(result);
        
        // Update user statistics
        userService.updateUserStats(userId, request.getWpm(), request.getAccuracy());
    }
}

