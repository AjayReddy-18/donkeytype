package com.donkeytype.service;

import com.donkeytype.dto.LeaderboardEntry;
import com.donkeytype.entity.User;
import com.donkeytype.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for leaderboard operations
 */
@Service
public class LeaderboardService {
    
    private final UserRepository userRepository;
    
    @Autowired
    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Get top users by best WPM
     */
    public List<LeaderboardEntry> getTopByWpm(int limit) {
        List<User> users = userRepository.findTopByBestWpm();
        return users.stream()
                .limit(limit)
                .map(user -> new LeaderboardEntry(
                        user.getUsername(),
                        user.getBestWpm(),
                        user.getAverageAccuracy()
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * Get top users by average accuracy
     */
    public List<LeaderboardEntry> getTopByAccuracy(int limit) {
        List<User> users = userRepository.findTopByAverageAccuracy();
        return users.stream()
                .limit(limit)
                .map(user -> new LeaderboardEntry(
                        user.getUsername(),
                        user.getBestWpm(),
                        user.getAverageAccuracy()
                ))
                .collect(Collectors.toList());
    }
}

