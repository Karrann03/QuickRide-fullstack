package com.kv.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.kv.entity.UserEntity;
import com.kv.repository.UserRepository;
import com.kv.role.AppRole;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

    	 OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

         String email = oAuth2User.getAttribute("email");
         String name = oAuth2User.getAttribute("name");

         String selectedRole = (String) request.getSession().getAttribute("selectedRole");
         String authMode = (String) request.getSession().getAttribute("authMode");

         if (selectedRole == null || selectedRole.isBlank()) {
             selectedRole = "USER";
         }

         if (authMode == null || authMode.isBlank()) {
             authMode = "login";
         }

         Optional<UserEntity> existingUser = userRepository.findByEmail(email);

         UserEntity user;

         if (existingUser.isPresent()) {
             user = existingUser.get();
         } else {
             user = new UserEntity();
             user.setName(name);
             user.setEmail(email);
             user.setPassword("GOOGLE_LOGIN");
             user.setRole(AppRole.valueOf(selectedRole.toUpperCase()));
             userRepository.save(user);
         }

         request.getSession().removeAttribute("selectedRole");
         request.getSession().removeAttribute("authMode");

         String redirectUrl = "http://localhost:5173/oauth-success"
                 + "?id=" + user.getId()
                 + "&name=" + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8)
                 + "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)
                 + "&role=" + user.getRole().name()
                 + "&mode=" + authMode;

         response.sendRedirect(redirectUrl);
    }
}