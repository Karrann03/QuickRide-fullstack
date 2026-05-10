package com.kv.service;

import java.util.List;

import com.kv.RideStatus.DriverStatus;
import com.kv.dto.RideRequestDto;
import com.kv.dto.RideResponseDto;
import com.kv.dto.neabyDto;
import com.kv.entity.RideEntity;

public interface IRideService {

	RideResponseDto requestRide(RideRequestDto request);

	RideResponseDto getRideById(Long rideId);
	
	List<RideResponseDto> getAllRidesForUser(Long userId);

	RideResponseDto startRide(Long rideId);

	RideResponseDto endRide(Long rideId);

	RideResponseDto cancelRide(Long rideId);

	RideResponseDto verifyRideOtp(Long rideId, String otp);
	
	RideResponseDto currentRideByDriverId(Long driverId);
	
	String rejectRide(Long rideId,Long driverId);
	
	RideResponseDto updateRideStatus(Long rideId, String status);

	public List<neabyDto> getNearbyDrivers(double lat, double lng, double radiusKm, DriverStatus status);

	List<RideResponseDto> getAvailableRidesForDriver(Long driverId, double radiusKm);

	RideResponseDto driverAcceptRide(Long driverId, Long rideId);
	
	RideResponseDto getActiveRideForUser(Long userId);
}
