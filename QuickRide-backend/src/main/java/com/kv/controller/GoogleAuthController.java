package com.kv.controller;

import java.io.IOException;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/auth/google")
public class GoogleAuthController {

	@GetMapping("/user/login")
    public void loginAsUser(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.getSession().setAttribute("selectedRole", "USER");
        request.getSession().setAttribute("authMode", "login");
        response.sendRedirect("/oauth2/authorization/google");
    }

    @GetMapping("/driver/login")
    public void loginAsDriver(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.getSession().setAttribute("selectedRole", "DRIVER");
        request.getSession().setAttribute("authMode", "login");
        response.sendRedirect("/oauth2/authorization/google");
    }

    @GetMapping("/user/signup")
    public void signupAsUser(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.getSession().setAttribute("selectedRole", "USER");
        request.getSession().setAttribute("authMode", "signup");
        response.sendRedirect("/oauth2/authorization/google");
    }

    @GetMapping("/driver/signup")
    public void signupAsDriver(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.getSession().setAttribute("selectedRole", "DRIVER");
        request.getSession().setAttribute("authMode", "signup");
        response.sendRedirect("/oauth2/authorization/google");
    }
}