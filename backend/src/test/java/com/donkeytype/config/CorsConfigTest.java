package com.donkeytype.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.filter.CorsFilter;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    void testCorsFilter() {
        CorsConfig corsConfig = new CorsConfig();
        CorsFilter corsFilter = corsConfig.corsFilter();

        assertNotNull(corsFilter);
    }

    @Test
    void testCorsConfiguration() {
        CorsConfig corsConfig = new CorsConfig();
        CorsFilter corsFilter = corsConfig.corsFilter();

        // Verify filter is created (indirectly tests configuration)
        assertNotNull(corsFilter);
    }
}

