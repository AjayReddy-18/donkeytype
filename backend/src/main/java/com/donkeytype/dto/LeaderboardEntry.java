package com.donkeytype.dto;

/**
 * DTO for leaderboard entries
 */
public class LeaderboardEntry {
    
    private String username;
    private Integer bestWpm;
    private Double averageAccuracy;
    
    public LeaderboardEntry() {}
    
    public LeaderboardEntry(String username, Integer bestWpm, Double averageAccuracy) {
        this.username = username;
        this.bestWpm = bestWpm;
        this.averageAccuracy = averageAccuracy;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
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
}

