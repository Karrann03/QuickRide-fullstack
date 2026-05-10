package com.kv.controller;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kv.dto.RideRequestDto;
import com.kv.dto.RideResponseDto;
import com.kv.service.IRideService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/ride")
@Tag(name = "Ride APIs", description = "Operations related to ride booking")
public class RideController {

	@Autowired
	private IRideService rideService;

	
	@PostMapping("/request")
	public ResponseEntity<RideResponseDto> requestRide(@RequestBody RideRequestDto request) {
		
		RideResponseDto dto = rideService.requestRide(request);
		return ResponseEntity.ok(dto);
	}
	
	@Transactional
	@PostMapping("/accept/{rideId}/{driverId}")
	public ResponseEntity<RideResponseDto> driverAcceptRide(@PathVariable Long driverId,
	                                                        @PathVariable Long rideId) {
	    return ResponseEntity.ok(rideService.driverAcceptRide(rideId, driverId));
	}

	@PostMapping("/verify-otp/{rideId}/{otp}")
	public ResponseEntity<RideResponseDto> verifyRideOtp(@PathVariable Long rideId,
	                                                     @PathVariable String otp) {
	    return ResponseEntity.ok(rideService.verifyRideOtp(rideId, otp));
	}
	
   @GetMapping("/id/{rideId}")
	public ResponseEntity<RideResponseDto> getRideById(@PathVariable Long rideId) {
	    return ResponseEntity.ok(rideService.getRideById(rideId));
	}
	
    @GetMapping("/my-rides/{userId}")
    public ResponseEntity<List<RideResponseDto>> getRidesForUser(@PathVariable Long userId) {
		List<RideResponseDto> dto = rideService.getAllRidesForUser(userId);
		return ResponseEntity.ok(dto);
    }
    
    @PostMapping("/status/{rideId}/{status}")
    public ResponseEntity<RideResponseDto> updateRideStatus(@PathVariable Long rideId, @PathVariable String status) {
		return ResponseEntity.ok(rideService.updateRideStatus(rideId, status));
	}
    
    @PostMapping("/end/{rideId}")
    public ResponseEntity<RideResponseDto> endRide(@PathVariable Long rideId) {
		return ResponseEntity.ok(rideService.endRide(rideId));
	}
    
    @PostMapping("/cancel/{rideId}")
    public ResponseEntity<RideResponseDto> cancelRide(@PathVariable Long rideId) {
    			return ResponseEntity.ok(rideService.cancelRide(rideId));
    }
    
    @PostMapping("/reject/{rideId}/{driverId}")
    public ResponseEntity<String> rejectRide(@PathVariable Long rideId, @PathVariable Long driverId) {
				return ResponseEntity.ok(rideService.rejectRide(rideId, driverId));
	}
    
    @GetMapping("/active/{userId}")
    public ResponseEntity<RideResponseDto> getActiveRideForUser(@PathVariable Long userId) {
    			return ResponseEntity.ok(rideService.getActiveRideForUser(userId));
    }
}	
