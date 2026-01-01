package com.donkeytype.dto;

/**
 * DTO for user response (without password)
 */
public class UserResponse {
    
    private Long id;
    private String username;
    private String email;
    private Integer bestWpm;
    private Double averageAccuracy;
    private Integer totalTests;
    
    public UserResponse() {}
    
    public UserResponse(Long id, String username, String email, Integer bestWpm, 
                       Double averageAccuracy, Integer totalTests) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.bestWpm = bestWpm;
        this.averageAccuracy = averageAccuracy;
        this.totalTests = totalTests;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public Integer getBestWpm() {
        return bestWpm;
    }
    
    public void setBestWpm(Integer bestWpm) {
        this.bestWpm = bestWpm;
    }
    
    public Double getAverageAccuracy() {
        return averageAccuracy;
    }
    
    public void setAverageAccuracy(Double averageAccuracy) {
        this.averageAccuracy = averageAccuracy;
    }
    
    public Integer getTotalTests() {
        return totalTests;
    }
    
    public void setTotalTests(Integer totalTests) {
        this.totalTests = totalTests;
    }
}

