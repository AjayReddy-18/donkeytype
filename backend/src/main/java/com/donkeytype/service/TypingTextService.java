package com.donkeytype.service;

import com.donkeytype.dto.TypingTextResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * Service for providing typing text samples
 * In MVP, using hardcoded samples. In production, could fetch from database or external API
 */
@Service
public class TypingTextService {
    
    private final List<String> sampleTexts = Arrays.asList(
            "The quick brown fox jumps over the lazy dog. This is a classic typing test sentence that contains every letter of the alphabet.",
            "Programming is the art of telling a computer what to do through a series of instructions. It requires logic, creativity, and patience.",
            "The internet has revolutionized how we communicate, work, and learn. It connects billions of people around the world in ways never before possible.",
            "Reading books expands your mind and opens new worlds. Each page turned is a journey into someone else's thoughts and experiences.",
            "Music has the power to evoke emotions and memories. A single melody can transport you back to a moment in time or inspire new feelings.",
            "Nature provides us with beauty, resources, and inspiration. From towering mountains to vast oceans, the natural world never ceases to amaze.",
            "Technology continues to evolve at a rapid pace, changing how we live and work. Innovation drives progress and shapes our future.",
            "Learning a new skill takes time and dedication. Practice makes perfect, and every expert was once a beginner who refused to give up.",
            "Friendship is one of life's greatest treasures. True friends support you through challenges and celebrate your successes.",
            "Travel broadens your perspective and teaches you about different cultures. Exploring new places creates lasting memories and personal growth."
    );
    
    private final Random random = new Random();
    
    /**
     * Get a random typing text sample
     */
    public TypingTextResponse getRandomText() {
        String text = sampleTexts.get(random.nextInt(sampleTexts.size()));
        int wordCount = text.split("\\s+").length;
        return new TypingTextResponse(text, wordCount);
    }
}

