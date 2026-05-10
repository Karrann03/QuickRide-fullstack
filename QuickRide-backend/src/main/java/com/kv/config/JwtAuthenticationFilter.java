package com.kv.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.kv.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	@Autowired
	private JwtUtil jwtUtil;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		String path = request.getServletPath();

		if (path.startsWith("/api/auth/")) {
		    filterChain.doFilter(request, response);
		    return;
		}
		
		String authHeader = request.getHeader("Authorization");
		
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		String token = authHeader.substring(7);

		try {
			String email = jwtUtil.extractEmail(token);
			String role = jwtUtil.extractRole(token);

			if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
				SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(email,
						null, Collections.singletonList(authority));

				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

				SecurityContextHolder.getContext().setAuthentication(authentication);
			}

		} catch (Exception e) {
		    filterChain.doFilter(request, response);
		    return;
		}

		filterChain.doFilter(request, response);
	}

}
