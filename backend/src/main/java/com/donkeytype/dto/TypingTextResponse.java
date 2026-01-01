package com.donkeytype.dto;

/**
 * DTO for returning typing text to frontend
 */
public class TypingTextResponse {
    
    private String text;
    private Integer wordCount;
    
    public TypingTextResponse() {}
    
    public TypingTextResponse(String text, Integer wordCount) {
        this.text = text;
        this.wordCount = wordCount;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public Integer getWordCount() {
        return wordCount;
    }
    
    public void setWordCount(Integer wordCount) {
        this.wordCount = wordCount;
    }
}

