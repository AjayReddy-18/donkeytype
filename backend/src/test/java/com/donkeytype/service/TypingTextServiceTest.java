package com.donkeytype.service;

import com.donkeytype.dto.TypingTextResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TypingTextServiceTest {

    @InjectMocks
    private TypingTextService typingTextService;

    @Test
    void testGetRandomText_ReturnsValidResponse() {
        TypingTextResponse response = typingTextService.getRandomText();

        assertNotNull(response);
        assertNotNull(response.getText());
        assertFalse(response.getText().isEmpty());
        assertTrue(response.getWordCount() > 0);
    }

    @Test
    void testGetRandomText_WordCountMatchesText() {
        TypingTextResponse response = typingTextService.getRandomText();

        String[] words = response.getText().split("\\s+");
        assertEquals(words.length, response.getWordCount());
    }

    @Test
    void testGetRandomText_ReturnsDifferentTexts() {
        // Get multiple texts to ensure randomness
        Set<String> texts = new HashSet<>();
        for (int i = 0; i < 20; i++) {
            TypingTextResponse response = typingTextService.getRandomText();
            texts.add(response.getText());
        }

        // Should have some variety (at least 2 different texts in 20 calls)
        assertTrue(texts.size() >= 2, "Service should return different texts");
    }

    @Test
    void testGetRandomText_AllTextsAreFromSampleList() {
        String[] validTexts = {
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
        };

        Set<String> validTextSet = Set.of(validTexts);

        for (int i = 0; i < 50; i++) {
            TypingTextResponse response = typingTextService.getRandomText();
            assertTrue(validTextSet.contains(response.getText()), 
                "Text should be from the valid sample list");
        }
    }
}

