package com.kv.dto;

import com.kv.RideStatus.VehicleType;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class RideResponseDto {

	private Long rideId;
	private Long driverId;
	private Long userId;
	private String UserName;
	private String UserPhone;
	private String status;
	private Double pickupLat;
	private Double pickupLong;
	private Double dropLat;
	private Double dropLong;
	private Double DriverLat;
	private Double DriverLong;
	private Double distanceKm;
	private Double fare;
	// driver -> pickup distance
	private Double distanceToPickupKm;
	private VehicleType vehicleType;
	
	//Driver Response to User
	private String driverName;
	private String driverPhone;
	private String vehicleNumber;
	private Double etaToPickupMinutes;

	private String otp;
	private boolean otpVerified;
}
