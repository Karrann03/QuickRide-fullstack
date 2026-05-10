package com.kv.service.driver;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.kv.RideStatus.DriverStatus;
import com.kv.RideStatus.RideStatus;
import com.kv.RideStatus.VehicleType;
import com.kv.dto.neabyDto;
import com.kv.entity.DriverEntity;
import com.kv.entity.RideEntity;
import com.kv.repository.DriverRepository;
import com.kv.repository.RideRepository;
import com.kv.role.AppRole;

import jakarta.transaction.Transactional;

@Service
public class DriverServiceImpl implements IDriverService {

	@Autowired
	private DriverRepository driverRepo;
	
	@Autowired
	private RideRepository rideRepo;
	
	@Override
	public DriverEntity updateLocation(Long d_id, double latitude, double longitude) {
		DriverEntity driver = driverRepo.findById(d_id).orElseThrow(() -> 
								new RuntimeException("Driver Not Found"));
		
		driver.setLatitude(latitude);
		driver.setLongitude(longitude);
		driver.setStatus(DriverStatus.AVAILABLE);
		
		DriverEntity saved = driverRepo.save(driver);
		 System.out.println("Saved lat = " + saved.getLatitude());
		    System.out.println("Saved lng = " + saved.getLongitude());
		    return saved;
	}

	@Override
	public DriverEntity setDriverAvailabilty(Long d_id) {
		DriverEntity driver = driverRepo.findById(d_id).orElseThrow(() -> new RuntimeException("Driver Not Found"));
		driver.setStatus(DriverStatus.AVAILABLE);
		return driverRepo.save(driver);
	}

	@Cacheable(value = "availableDrivers", key = "#vehicleType")
	@Override
	public List<DriverEntity> getAvailableDriversWithVehicle(VehicleType type) {
		return driverRepo.findByStatusAndVehicleType(DriverStatus.AVAILABLE, type);
	}

	@Override
	public DriverEntity registerDriver(DriverEntity driver) {
		driver.setStatus(DriverStatus.AVAILABLE);
		driver.setRole(AppRole.DRIVER);
		return driverRepo.save(driver);
		
	}

	@Override
	public List<DriverEntity> getAvailableDrivers() {
		
		return driverRepo.findByStatus(DriverStatus.AVAILABLE);
	}

	@Override
	@Transactional
	public void acceptRide(Long driverId, Long rideId) {

		DriverEntity driver = driverRepo.findById(driverId)
	            .orElseThrow(() -> new RuntimeException("Driver Not Found"));

	    if (driver.getStatus() != DriverStatus.AVAILABLE) {
	        throw new RuntimeException("Driver not available");
	    }

	    int updated = rideRepo.acceptRideAtomic(rideId, driver);

	    if (updated == 0) {
	        throw new RuntimeException("Ride already accepted by someone else");
	    }

	    driver.setStatus(DriverStatus.BUSY);
	    driverRepo.save(driver);
	}
	
	@Override
	public String rejectRide(Long driverId, Long rideId) {
		
		DriverEntity driver = driverRepo.findById(driverId)
	            .orElseThrow(() -> new RuntimeException("Driver Not Found"));

	    if (driver.getStatus() != DriverStatus.AVAILABLE) {
	        throw new RuntimeException("Driver not available");
	    }

	    RideEntity ride = rideRepo.findById(rideId)
	            .orElseThrow(() -> new RuntimeException("Ride Not Found"));

	    if (ride.getStatus() != RideStatus.REQUESTED) {
	        throw new RuntimeException("Ride not in a state to be rejected");
	    }

	    ride.setStatus(RideStatus.REJECTED);
	    rideRepo.save(ride);

	    return "Ride rejected successfully";
		
	}

	

}
