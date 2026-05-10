package com.kv.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kv.AuthService.IAuthService;
import com.kv.dto.LoginRequestDto;
import com.kv.dto.LoginResponseDto;
import com.kv.dto.UserResponseDto;
import com.kv.entity.UserEntity;
import com.kv.service.user.*;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
@Tag(name = "USER APIs", description = "Operations related to User")
public class UserController {

    @Autowired
    private IUserService userService;
    
    @Autowired
    private IAuthService authService;

    // Register user
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody UserEntity user) {
    	String resp = userService.registerUser(user);
        return new ResponseEntity<String>(resp,HttpStatus.OK);
    }

    // Login user
    @GetMapping("/login")
    public ResponseEntity<LoginResponseDto> loginUser(@RequestBody LoginRequestDto request) {
         LoginResponseDto resp = authService.login(request);
         return ResponseEntity.ok(resp);
    }

    // Get all users (for testing/admin)
    @GetMapping("/all")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
    	List<UserResponseDto> users = userService.getAllUsers();
		 return ResponseEntity.ok(users);
    }
}
