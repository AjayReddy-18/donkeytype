package com.donkeytype.repository;

import com.donkeytype.entity.TypingTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for TypingTestResult entity
 */
@Repository
public interface TypingTestResultRepository extends JpaRepository<TypingTestResult, Long> {
    
    List<TypingTestResult> findByUserIdOrderByTestDateDesc(Long userId);
}

