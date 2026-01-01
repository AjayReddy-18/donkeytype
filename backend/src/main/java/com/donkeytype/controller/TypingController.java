package com.donkeytype.controller;

import com.donkeytype.dto.SubmitResultRequest;
import com.donkeytype.dto.TypingTextResponse;
import com.donkeytype.service.TypingTestService;
import com.donkeytype.service.TypingTextService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for typing test endpoints
 */
@RestController
@RequestMapping("/api/typing")
public class TypingController {
    
    private final TypingTextService typingTextService;
    private final TypingTestService typingTestService;
    
    @Autowired
    public TypingController(TypingTextService typingTextService,
                           TypingTestService typingTestService) {
        this.typingTextService = typingTextService;
        this.typingTestService = typingTestService;
    }
    
    /**
     * Get a random typing text sample
     */
    @GetMapping("/text")
    public ResponseEntity<TypingTextResponse> getText() {
        TypingTextResponse response = typingTextService.getRandomText();
        return ResponseEntity.ok(response);
    }
    
    /**
     * Submit typing test results
     * Note: In production, userId should come from session/token authentication
     * For MVP, accepting userId as path parameter
     */
    @PostMapping("/submit/{userId}")
    public ResponseEntity<?> submitResult(
            @PathVariable Long userId,
            @Valid @RequestBody SubmitResultRequest request) {
        try {
            typingTestService.submitResult(userId, request);
            return ResponseEntity.ok().body(new SuccessResponse("Result submitted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Simple response classes
     */
    private static class SuccessResponse {
        private String message;
        
        public SuccessResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
    }
    
    private static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
    }
}

