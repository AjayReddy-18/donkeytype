package com.donkeytype.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity to store individual typing test results
 */
@Entity
@Table(name = "typing_test_results")
public class TypingTestResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    private Integer wpm;
    
    private Double accuracy;
    
    private Integer totalErrors;
    
    private Integer timeSeconds;
    
    @Column(name = "test_date")
    private LocalDateTime testDate;
    
    @PrePersist
    protected void onCreate() {
        testDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Integer getWpm() {
        return wpm;
    }
    
    public void setWpm(Integer wpm) {
        this.wpm = wpm;
    }
    
    public Double getAccuracy() {
        return accuracy;
    }
    
    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }
    
    public Integer getTotalErrors() {
        return totalErrors;
    }
    
    public void setTotalErrors(Integer totalErrors) {
        this.totalErrors = totalErrors;
    }
    
    public Integer getTimeSeconds() {
        return timeSeconds;
    }
    
    public void setTimeSeconds(Integer timeSeconds) {
        this.timeSeconds = timeSeconds;
    }
    
    public LocalDateTime getTestDate() {
        return testDate;
    }
    
    public void setTestDate(LocalDateTime testDate) {
        this.testDate = testDate;
    }
}

