package com.kv.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kv.RideStatus.DriverStatus;
import com.kv.dto.LoginRequestDto;
import com.kv.dto.LoginResponseDto;
import com.kv.entity.DriverEntity;
import com.kv.entity.UserEntity;
import com.kv.repository.DriverRepository;
import com.kv.repository.UserRepository;
import com.kv.role.AppRole;
import com.kv.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // allow frontend calls
public class OAuthController {

	  @Autowired
	    private UserRepository userRepo;

	    @Autowired
	    private DriverRepository driverRepo;

	    @Autowired
	    private JwtUtil jwtUtil;

	    @PostMapping("/login")
	    public LoginResponseDto login(@RequestBody LoginRequestDto request) {

	        Optional<UserEntity> userOpt = userRepo.findByEmail(request.getEmail());
	        if (userOpt.isPresent()) {
	            UserEntity user = userOpt.get();

	            if (!user.getPassword().equals(request.getPassword())) {
	                throw new RuntimeException("Invalid password");
	            }

	            String token = jwtUtil.generateToken(user.getEmail(), "USER");

	            return new LoginResponseDto(
	                user.getId(),
	                "USER",
	                "Login Successful",
	                token
	            );
	        }

	        Optional<DriverEntity> driverOpt = driverRepo.findByEmail(request.getEmail());
	        if (driverOpt.isPresent()) {
	            DriverEntity driver = driverOpt.get();

	            if (!driver.getPassword().equals(request.getPassword())) {
	                throw new RuntimeException("Invalid password");
	            }

	            String token = jwtUtil.generateToken(driver.getEmail(), "DRIVER");

	            return new LoginResponseDto(
	                driver.getId(),
	                "DRIVER",
	                "Login Successful",
	                token
	            );
	        }

	        throw new RuntimeException("Account not found");
	    }
	    
	    @PostMapping("/user/signup")
	    public ResponseEntity<?> userSignup(@RequestBody UserEntity user) {

	        if (userRepo.findByEmail(user.getEmail()).isPresent()) {
	            return ResponseEntity.badRequest().body(Map.of("message", "User email already exists"));
	        }
	        user.setRole(AppRole.USER);
	        userRepo.save(user);
	        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
	    }

	    @PostMapping("/driver/signup")
	    public ResponseEntity<?> driverSignup(@RequestBody DriverEntity driver) {

	        if (driverRepo.findByEmail(driver.getEmail()).isPresent()) {
	            return ResponseEntity.badRequest().body(Map.of("message", "Driver email already exists"));
	        }
	        driver.setStatus(DriverStatus.AVAILABLE);
	        driver.setRole(AppRole.DRIVER);
	        driverRepo.save(driver);
	        return ResponseEntity.ok(Map.of("message", "Driver registered successfully"));
	    }
}
