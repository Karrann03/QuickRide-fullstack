package com.kv.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

	 @Autowired
	    private OAuth2LoginSuccessHandler successHandler;

	    @Autowired
	    private JwtAuthenticationFilter jwtAuthenticationFilter;

	    @Bean
	    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	        http
	            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
	            .csrf(csrf -> csrf.disable())
	            .authorizeHttpRequests(auth -> auth
	                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
	                .requestMatchers(
	                    "/api/auth/**",
	                    "/auth/google/**",
	                    "/oauth2/**",
	                    "/login/**",
	                    "/swagger-ui/**",
	                    "/v3/api-docs/**"
	                ).permitAll()
	                .requestMatchers("/api/user/**").hasRole("USER")
	                .requestMatchers("/driver/**").hasRole("DRIVER")
	                .requestMatchers("/ride/**").authenticated()
	                .anyRequest().authenticated()
	            )
	            .oauth2Login(oauth2 -> oauth2
	                .successHandler(successHandler)
	            )
	            .exceptionHandling(ex -> ex
	                .authenticationEntryPoint((request, response, authException) -> {
	                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
	                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
	                    response.getWriter().write("{\"error\":\"Unauthorized\"}");
	                })
	            )
	            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

	        return http.build();
	    }

	    @Bean
	    public OpenAPI customOpenAPI() {
	        return new OpenAPI()
	            .info(new Info()
	                .title("QuickRide - Uber Clone Backend")
	                .version("1.0")
	                .description("Ride booking system with nearest driver matching"));
	    }

	    @Bean
	    public CorsConfigurationSource corsConfigurationSource() {
	        CorsConfiguration configuration = new CorsConfiguration();

	        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
	        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
	        configuration.setAllowedHeaders(List.of("*"));
	        configuration.setAllowCredentials(true);

	        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	        source.registerCorsConfiguration("/**", configuration);
	        return source;
	    }
}