package com.kv.controller;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kv.RideStatus.DriverStatus;
import com.kv.dto.RideResponseDto;
import com.kv.dto.neabyDto;
import com.kv.entity.DriverEntity;
import com.kv.service.IRideService;
import com.kv.service.driver.*;

import io.swagger.v3.oas.annotations.tags.Tag;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/driver")
@Tag(name = "Driver APIs", description = "Operations related to Driver Details")
public class DriverController {

	@Autowired
	private IDriverService driverService;
	
	@Autowired
	private IRideService rideService;
	
	
	// Register driver
    @PostMapping("/register")
    public DriverEntity registerDriver(@RequestBody DriverEntity driver) {
        return driverService.registerDriver(driver);
    }
	
	@PutMapping("/update-Location/{driver_id}")
	public DriverEntity updateLocation(@PathVariable Long driver_id,
											@RequestParam double latitude,
											@RequestParam double longitude) { 
		System.out.println("UPDATE API HIT");
	    System.out.println("driver_id = " + driver_id);
	    System.out.println("latitude = " + latitude);
	    System.out.println("longitude = " + longitude);
		return driverService.updateLocation(driver_id, latitude, longitude);
				
	}
	
	@GetMapping("/{driverId}/available-rides")
	public ResponseEntity<List<RideResponseDto>> availableRides(
	        @PathVariable Long driverId,
	        @RequestParam(defaultValue = "5") double radiusKm
	) {
	    return ResponseEntity.ok(rideService.getAvailableRidesForDriver(driverId, radiusKm));
	}
	
	
	
	 // Get all available drivers
//    @GetMapping("/available")
//    public List<DriverEntity> getAvailableDrivers(@RequestParam(required = false) VehicleType vehicleType) {
//        if (vehicleType != null) {
//            return driverService.getAvailableDriversWithVehicle(vehicleType);
//        } 
//        return driverService.getAvailableDrivers();
//        }
    
    @PostMapping("/set-availability/{driverId}")
    public ResponseEntity<DriverEntity> setDriverAvailability(@PathVariable Long driverId) {
		DriverEntity updatedDriver = driverService.setDriverAvailabilty(driverId);
		return ResponseEntity.ok(updatedDriver);
	}
    
    @GetMapping("/nearby")
    public List<neabyDto> nearbyDrivers(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam double radius,
        @RequestParam DriverStatus status
    ) {
        return rideService.getNearbyDrivers(lat, lng, radius, status);
    }
    
    @PostMapping("/{driverId}/accept/{rideId}")
    public ResponseEntity<RideResponseDto> acceptRide(
            @PathVariable Long driverId,
            @PathVariable Long rideId
    ) {
        return ResponseEntity.ok(rideService.driverAcceptRide(driverId, rideId));
    }

    @PostMapping("/{driverId}/reject/{rideId}")
    public ResponseEntity<String> rejectRide(
            @PathVariable Long driverId,
            @PathVariable Long rideId
    ) {
        //  reject = just ignore in UI; can log later
        return ResponseEntity.ok("Rejected");
    }
    
    @GetMapping("/current-ride/{driverId}")
    public ResponseEntity<?> getCurrentRide(@PathVariable Long driverId) {
        try {
            RideResponseDto response = rideService.currentRideByDriverId(driverId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
    
}
