package com.donkeytype.repository;

import com.donkeytype.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    /**
     * Find top users by best WPM
     */
    @Query("SELECT u FROM User u WHERE u.bestWpm > 0 ORDER BY u.bestWpm DESC")
    List<User> findTopByBestWpm();
    
    /**
     * Find top users by average accuracy
     */
    @Query("SELECT u FROM User u WHERE u.totalTests > 0 ORDER BY u.averageAccuracy DESC")
    List<User> findTopByAverageAccuracy();
}

