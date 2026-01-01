package com.donkeytype.controller;

import com.donkeytype.dto.LeaderboardEntry;
import com.donkeytype.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for leaderboard endpoints
 */
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    
    private final LeaderboardService leaderboardService;
    
    @Autowired
    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }
    
    /**
     * Get top users by WPM
     */
    @GetMapping("/wpm")
    public ResponseEntity<List<LeaderboardEntry>> getTopByWpm(
            @RequestParam(defaultValue = "10") int limit) {
        List<LeaderboardEntry> entries = leaderboardService.getTopByWpm(limit);
        return ResponseEntity.ok(entries);
    }
    
    /**
     * Get top users by accuracy
     */
    @GetMapping("/accuracy")
    public ResponseEntity<List<LeaderboardEntry>> getTopByAccuracy(
            @RequestParam(defaultValue = "10") int limit) {
        List<LeaderboardEntry> entries = leaderboardService.getTopByAccuracy(limit);
        return ResponseEntity.ok(entries);
    }
}

