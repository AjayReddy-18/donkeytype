package com.donkeytype.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO for submitting typing test results
 */
public class SubmitResultRequest {
    
    @NotNull(message = "WPM is required")
    @Positive(message = "WPM must be positive")
    private Integer wpm;
    
    @NotNull(message = "Accuracy is required")
    private Double accuracy;
    
    @NotNull(message = "Total errors is required")
    private Integer totalErrors;
    
    @NotNull(message = "Time in seconds is required")
    @Positive(message = "Time must be positive")
    private Integer timeSeconds;
    
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
}

