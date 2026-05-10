package com.kv.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.kv.RideStatus.DriverStatus;
import com.kv.RideStatus.RideStatus;
import com.kv.RideStatus.VehicleType;
import com.kv.dto.FareEstimateResponseDto;
import com.kv.dto.RideRequestDto;
import com.kv.dto.RideResponseDto;
import com.kv.dto.VehicleFareDto;
import com.kv.dto.neabyDto;
import com.kv.entity.DriverEntity;
import com.kv.entity.RideEntity;
import com.kv.entity.RideRejection;
import com.kv.entity.UserEntity;
import com.kv.repository.DriverRepository;
import com.kv.repository.RideRejectionRepository;
import com.kv.repository.RideRepository;
import com.kv.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class RideServiceImpl implements IRideService {

	@Autowired
	private UserRepository userRepo;

	@Autowired
	private RideRepository rideRepo;

	@Autowired
	private DriverRepository driverRepo;
	
	@Autowired
	private RideRejectionRepository rideRejectionRepository;

	@Override
	public RideResponseDto requestRide(RideRequestDto request) {

		// Fetch User
		UserEntity user = userRepo.findById(request.getUserId())
	            .orElseThrow(() -> new RuntimeException("User Not Found"));

	    RideEntity ride = new RideEntity();
	    ride.setUser(user);
	    ride.setDriver(null);

	    ride.setPickupLat(request.getPickupLat());
	    ride.setPickupLong(request.getPickupLong());
	    ride.setDropLat(request.getDropLat());
	    ride.setDropLong(request.getDropLong());

	    ride.setVehicleType(request.getVehicleType());
	    ride.setStatus(RideStatus.REQUESTED);
	    ride.setCreatedAt(LocalDateTime.now());

	    double distanceKm = haversineDistance(
	            request.getPickupLat(),
	            request.getPickupLong(),
	            request.getDropLat(),
	            request.getDropLong()
	    );

	    double fare = calculateFare(distanceKm, request.getVehicleType());

	    // IMPORTANT: persist these values
	    ride.setDistanceKm(distanceKm);     // add field in entity if not present
	    ride.setFare(fare);

	    ride.setAssignedAt(null);

	    RideEntity savedRide = rideRepo.save(ride);

	    RideResponseDto response = new RideResponseDto();
	    response.setRideId(savedRide.getId());
	    response.setDriverId(null);
	    response.setUserId(user.getId());
	    response.setStatus(savedRide.getStatus().toString());
	    response.setPickupLat(savedRide.getPickupLat());
	    response.setPickupLong(savedRide.getPickupLong());
	    response.setDropLat(savedRide.getDropLat());
	    response.setDropLong(savedRide.getDropLong());
	    response.setDistanceKm(savedRide.getDistanceKm());
	    response.setFare(savedRide.getFare());
	    response.setVehicleType(savedRide.getVehicleType());

	    return response;
	}

	public DriverEntity findNearestDriver(double pickupLat, double pickupLong, VehicleType vehicleType) {

		List<DriverEntity> availableDrivers = driverRepo.findByStatusAndVehicleType(DriverStatus.AVAILABLE,
				vehicleType);

		if (availableDrivers.isEmpty()) {
			return null;
		}
		DriverEntity nearest = null;
		double minDistance = Double.MAX_VALUE;

		for (DriverEntity driver : availableDrivers) {

			if (driver.getLatitude() == null || driver.getLongitude() == null) {
				continue;
			}

			double distance = haversineDistance(pickupLat, pickupLong, driver.getLatitude(), driver.getLongitude());

			if (distance < minDistance) {
				minDistance = distance;
				nearest = driver;
			}
		}
		return nearest;
	}

	private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
		final int R = 6371; // Earth radius in km
		double latDistance = Math.toRadians(lat2 - lat1);
		double lonDistance = Math.toRadians(lon2 - lon1);
		double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) + Math.cos(Math.toRadians(lat1))
				* Math.cos(Math.toRadians(lat2)) * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	// Fare calculation based on distance & vehicle type
	private double calculateFare(double distanceKm, VehicleType vehicleType) {
		double baseFare = 50; // base fare
		double perKmRate = 10; // default

		switch (vehicleType) {
		case MINI_SUV -> perKmRate = 10;
		case SEDAN -> perKmRate = 15;
		case SUV -> perKmRate = 20;
		}

		return baseFare + (perKmRate * distanceKm);
	}

	@Override
	public RideResponseDto endRide(Long rideId) {
		RideEntity ride = rideRepo.findById(rideId)
	            .orElseThrow(() -> new RuntimeException("Ride Not Found"));

	    DriverEntity driver = ride.getDriver();

	    if (driver == null) {
	        throw new RuntimeException("No driver assigned to this ride");
	    }

	    if (ride.getStatus() != RideStatus.ONGOING
	            && ride.getStatus() != RideStatus.STARTED
	            && ride.getStatus() != RideStatus.ACCEPTED) {
	        throw new RuntimeException("Ride must be active before ending");
	    }

	    ride.setStatus(RideStatus.COMPLETED);
	    ride.setCompletedAt(LocalDateTime.now());
	    rideRepo.save(ride);

//	     Optional: keep if DriverEntity really has status
	     driver.setStatus(DriverStatus.AVAILABLE);
	     driverRepo.save(driver);

	    RideResponseDto response = new RideResponseDto();
	    response.setRideId(ride.getId());
	    response.setDriverId(driver.getId());
	    response.setUserId(ride.getUser() != null ? ride.getUser().getId() : null);
	    response.setStatus(ride.getStatus().toString());
	    response.setPickupLat(ride.getPickupLat());
	    response.setPickupLong(ride.getPickupLong());
	    response.setDropLat(ride.getDropLat());
	    response.setDropLong(ride.getDropLong());

	    double distanceKm = ride.getDistanceKm() != null
	            ? ride.getDistanceKm()
	            : haversineDistance(
	                    ride.getPickupLat(),
	                    ride.getPickupLong(),
	                    ride.getDropLat(),
	                    ride.getDropLong()
	              );

	    response.setDistanceKm(distanceKm);

	    double fare = ride.getFare() != null
	            ? ride.getFare()
	            : calculateFare(distanceKm, ride.getVehicleType());

	    response.setFare(fare);
	    response.setVehicleType(ride.getVehicleType());

	    return response;

	}

	@Scheduled(fixedRate = 10000) // every 10 seconds
	public void checkExpiredRides() {

		List<RideEntity> rides = rideRepo.findByStatus(RideStatus.REQUESTED);

		for (RideEntity ride : rides) {

			if (ride.getAssignedAt() == null)
				continue;

			long seconds = Duration.between(ride.getAssignedAt(), LocalDateTime.now()).getSeconds();

			if (seconds > 30) { // 30 sec timeout

				reassignDriver(ride);
			}
		}
	}

	public DriverEntity findNextNearestDriver(double pickupLat, double pickupLong, VehicleType vehicleType,
			Long excludedDriverId) {

		List<DriverEntity> availableDrivers = driverRepo.findByStatusAndVehicleType(DriverStatus.AVAILABLE,
				vehicleType);

		if (availableDrivers.isEmpty()) {
			return null;
		}

		DriverEntity nearest = null;
		double minDistance = Double.MAX_VALUE;

		for (DriverEntity driver : availableDrivers) {

			// Skip the old driver
			if (driver.getId().equals(excludedDriverId)) {
				continue;
			}

			if (driver.getLatitude() == null || driver.getLongitude() == null) {
				continue;
			}

			double distance = haversineDistance(pickupLat, pickupLong, driver.getLatitude(), driver.getLongitude());

			if (distance < minDistance) {
				minDistance = distance;
				nearest = driver;
			}
		}

		return nearest;
	}

	@Transactional
	public void reassignDriver(RideEntity ride) {

		// Reload latest state from DB
		RideEntity freshRide = rideRepo.findById(ride.getId())
				.orElseThrow(() -> new RuntimeException("Ride not found"));

		if (freshRide.getStatus() != RideStatus.REQUESTED) {
			return; // someone already accepted
		}

		DriverEntity oldDriver = freshRide.getDriver();

		// make old driver available
		oldDriver.setStatus(DriverStatus.AVAILABLE);
		driverRepo.save(oldDriver);

		// find next nearest (excluding old)
		DriverEntity nextDriver = findNextNearestDriver(ride.getPickupLat(), ride.getPickupLong(),
				ride.getDriver().getVehicleType(), oldDriver.getId());

		if (nextDriver == null) {
			ride.setStatus(RideStatus.CANCELLED);
		} else {
			ride.setDriver(nextDriver);
			ride.setAssignedAt(LocalDateTime.now());
			nextDriver.setStatus(DriverStatus.BUSY);
			driverRepo.save(nextDriver);
		}

		rideRepo.save(ride);
	}

	@Override
	public RideResponseDto startRide(Long rideId) {
		 RideEntity ride = rideRepo.findById(rideId)
		            .orElseThrow(() -> new RuntimeException("Ride Not Found"));

		    if (ride.getStatus() != RideStatus.ACCEPTED) {
		        throw new RuntimeException("Ride must be accepted first");
		    }

		    if (ride.getDriver() == null) {
		        throw new RuntimeException("No driver assigned to this ride");
		    }

		    ride.setStatus(RideStatus.ONGOING);
		    ride.setStartedAt(LocalDateTime.now());
		    rideRepo.save(ride);

		    RideResponseDto dto = new RideResponseDto();
		    dto.setRideId(ride.getId());
		    dto.setDriverId(ride.getDriver().getId());
		    dto.setUserId(ride.getUser() != null ? ride.getUser().getId() : null);
		    dto.setStatus(ride.getStatus().toString());
		    dto.setPickupLat(ride.getPickupLat());
		    dto.setPickupLong(ride.getPickupLong());
		    dto.setDropLat(ride.getDropLat());
		    dto.setDropLong(ride.getDropLong());
		    dto.setVehicleType(ride.getVehicleType());

		    double distanceKm = ride.getDistanceKm() != null
		            ? ride.getDistanceKm()
		            : haversineDistance(
		                    ride.getPickupLat(),
		                    ride.getPickupLong(),
		                    ride.getDropLat(),
		                    ride.getDropLong()
		              );

		    dto.setDistanceKm(distanceKm);

		    double fare = ride.getFare() != null
		            ? ride.getFare()
		            : calculateFare(distanceKm, ride.getVehicleType());

		    dto.setFare(fare);

		    return dto;
	}

	@Override
	public RideResponseDto getRideById(Long rideId) {
		RideEntity ride = rideRepo.findById(rideId)
	            .orElseThrow(() -> new RuntimeException("Ride Not Found"));

	    RideResponseDto dto = new RideResponseDto();
	    dto.setRideId(ride.getId());
	    dto.setStatus(ride.getStatus().toString());

	    if (ride.getUser() != null) {
	        dto.setUserId(ride.getUser().getId());
	        dto.setUserName(ride.getUser().getName());
	        dto.setUserPhone(ride.getUser().getPhone());
	    }

	    if (ride.getDriver() != null) {
	        dto.setDriverId(ride.getDriver().getId());
	        dto.setDriverName(ride.getDriver().getName());
	        dto.setDriverPhone(ride.getDriver().getPhone());
	        dto.setDriverLat(ride.getDriver().getLatitude());
	        dto.setDriverLong(ride.getDriver().getLongitude());
	    } else {
	        dto.setDriverId(null);
	        dto.setDriverName(null);
	        dto.setDriverPhone(null);
	        dto.setDriverLat(null);
	        dto.setDriverLong(null);
	    }

	    dto.setPickupLat(ride.getPickupLat());
	    dto.setPickupLong(ride.getPickupLong());
	    dto.setDropLat(ride.getDropLat());
	    dto.setDropLong(ride.getDropLong());

	    double distanceKm = ride.getDistanceKm() != null
	            ? ride.getDistanceKm()
	            : haversineDistance(
	                    ride.getPickupLat(),
	                    ride.getPickupLong(),
	                    ride.getDropLat(),
	                    ride.getDropLong()
	              );

	    dto.setDistanceKm(distanceKm);

	    if (ride.getVehicleType() != null) {
	        dto.setVehicleType(ride.getVehicleType());

	        double fare = ride.getFare() != null
	                ? ride.getFare()
	                : calculateFare(distanceKm, ride.getVehicleType());

	        dto.setFare(fare);
	    }

	    dto.setOtp(ride.getOtp());
	    dto.setOtpVerified(Boolean.TRUE.equals(ride.getOtpVerified()));
	    dto.setDistanceToPickupKm(ride.getDistanceToPickupKm());

	    return dto;
	}

	@Override
	public RideResponseDto cancelRide(Long rideId) {

		RideEntity ride = rideRepo.findById(rideId).orElseThrow(() -> new RuntimeException("Ride Not Found"));
		if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
			throw new RuntimeException("Cannot cancel a completed or already cancelled ride");
		}
		ride.setStatus(RideStatus.CANCELLED);
		rideRepo.save(ride);

		DriverEntity driver = ride.getDriver();
		if (driver != null) {
		    driver.setStatus(DriverStatus.AVAILABLE);
		    driverRepo.save(driver);
		}
		RideResponseDto response = new RideResponseDto();
		response.setRideId(ride.getId());
		response.setDriverId(driver != null ? driver.getId() : null);
		response.setUserId(ride.getUser().getId());
		response.setStatus(ride.getStatus().toString());
		response.setPickupLat(ride.getPickupLat());
		response.setPickupLong(ride.getPickupLong());
		response.setDropLat(ride.getDropLat());
		response.setDropLong(ride.getDropLong());
		response.setVehicleType(driver != null ? driver.getVehicleType() : ride.getVehicleType());
		response.setFare(calculateFare(
		        haversineDistance(ride.getPickupLat(), ride.getPickupLong(), ride.getDropLat(), ride.getDropLong()),
		        ride.getVehicleType()
		));
		return response;
	}

	public List<neabyDto> getNearbyDrivers(double lat, double lng, double radiusKm, DriverStatus status) {

		List<DriverEntity> drivers = driverRepo.findByStatus(status);

		return drivers.stream()
				.map(d -> new neabyDto(d.getId(), d.getName(), d.getLatitude(), d.getLongitude(),
						d.getVehicleType().name(), 
						d.getStatus().name()
				)).toList();
	}

	public FareEstimateResponseDto estimateFareForAllVehicles(double pickupLat, double pickupLong, double dropLat,
			double dropLong) {

		double distanceKm = haversineDistance(pickupLat, pickupLong, dropLat, dropLong);

		List<VehicleFareDto> list = List.of(createFare(VehicleType.MINI_SUV, distanceKm),
				createFare(VehicleType.SEDAN, distanceKm), createFare(VehicleType.SUV, distanceKm));

		FareEstimateResponseDto res = new FareEstimateResponseDto();
		res.setDistanceKm(distanceKm);
		res.setFares(list);

		return res;
	}

	private VehicleFareDto createFare(VehicleType type, double distanceKm) {
		VehicleFareDto dto = new VehicleFareDto();
		dto.setVehicleType(type);
		dto.setFare(calculateFare(distanceKm, type));
		return dto;
	}

	@Override
	public List<RideResponseDto> getAvailableRidesForDriver(Long driverId, double radiusKm) {

		DriverEntity driver = driverRepo.findById(driverId).orElseThrow(() -> new RuntimeException("Driver not found"));

		Double driverLat = driver.getLatitude();
		Double driverLng = driver.getLongitude();

		if (driverLat == null || driverLng == null) {
			throw new RuntimeException("Driver location not set");
		}

		// ONLY rides that are not accepted by anyone
		List<RideEntity> rides = rideRepo.findAvailableRidesForDriver(driverId);

		return rides.stream().filter(r -> r.getPickupLat() != null && r.getPickupLong() != null).filter(r -> {
			double d = haversineDistance(driverLat, driverLng, r.getPickupLat(), r.getPickupLong());
			return d <= radiusKm;
		}).map(r -> {
			double tripDistanceKm = haversineDistance(r.getPickupLat(), r.getPickupLong(), r.getDropLat(),
					r.getDropLong());

			// RideEntity should store vehicleType chosen by user
			VehicleType vt = r.getVehicleType();
			double fare = calculateFare(tripDistanceKm, vt);

			RideResponseDto dto = new RideResponseDto();
			dto.setRideId(r.getId());
			dto.setUserId(r.getUser().getId());
			dto.setStatus(r.getStatus().toString());

			dto.setPickupLat(r.getPickupLat());
			dto.setPickupLong(r.getPickupLong());
			dto.setDropLat(r.getDropLat());
			dto.setDropLong(r.getDropLong());

			dto.setVehicleType(vt);
			dto.setDistanceKm(tripDistanceKm);
			dto.setFare(fare);

			return dto;
		}).toList();

	}
	
	private String generateOtp() {
	    int otp = 1000 + new Random().nextInt(9000);
	    return String.valueOf(otp);
	}

	@Override
	@Transactional
	public String rejectRide(Long rideId, Long driverId) {
		RideEntity ride = rideRepo.findById(rideId)
	            .orElseThrow(() -> new RuntimeException("Ride not found"));

	    if (ride.getStatus() != RideStatus.REQUESTED || ride.getDriver() != null) {
	        return "Ride already unavailable";
	    }

	    boolean alreadyRejected = rideRejectionRepository.existsByRideIdAndDriverId(rideId, driverId);

	    if (!alreadyRejected) {
	        RideRejection rejection = new RideRejection();
	        rejection.setRideId(rideId);
	        rejection.setDriverId(driverId);

	        System.out.println("Before save -> rideId = " + rejection.getRideId());
	        System.out.println("Before save -> driverId = " + rejection.getDriverId());

	        RideRejection saved = rideRejectionRepository.saveAndFlush(rejection);

	        System.out.println("After save -> id = " + saved.getId());
	        System.out.println("After save -> rideId = " + saved.getRideId());
	        System.out.println("After save -> driverId = " + saved.getDriverId());
	    }
	    return "Ride rejected successfully";
	}
	
	@Override
	@Transactional
	public RideResponseDto driverAcceptRide(Long rideId, Long driverId) {

		DriverEntity driver = driverRepo.findById(driverId)
	            .orElseThrow(() -> new RuntimeException("Driver not found"));

	    if (driver.getStatus() != DriverStatus.AVAILABLE) {
	        throw new RuntimeException("Driver not available");
	    }

	    int updated = rideRepo.acceptRideAtomic(rideId, driver);
	    if (updated == 0) {
	        throw new RuntimeException("Ride already accepted by someone else");
	    }

	    driver.setStatus(DriverStatus.BUSY);
	    driverRepo.save(driver);

	    RideEntity ride = rideRepo.findById(rideId)
	            .orElseThrow(() -> new RuntimeException("Ride not found"));

	    UserEntity user = ride.getUser();

	    double tripDistanceKm = haversineDistance(
	            ride.getPickupLat(), ride.getPickupLong(),
	            ride.getDropLat(), ride.getDropLong()
	    );

	    double distanceToPickupKm = haversineDistance(
	            driver.getLatitude(), driver.getLongitude(),
	            ride.getPickupLat(), ride.getPickupLong()
	    );

	    VehicleType vt = ride.getVehicleType();
	    double fare = calculateFare(tripDistanceKm, vt);

	    ride.setDistanceKm(tripDistanceKm);
	    ride.setDistanceToPickupKm(distanceToPickupKm);
	    ride.setFare(fare);

	    ride.setOtp(generateOtp());
	    ride.setOtpVerified(false);

	    RideEntity savedRide = rideRepo.save(ride);

	    RideResponseDto dto = new RideResponseDto();
	    dto.setRideId(savedRide.getId());
	    dto.setUserId(user.getId());
	    dto.setDriverId(driver.getId());
	    dto.setStatus(savedRide.getStatus().toString());

	    dto.setPickupLat(savedRide.getPickupLat());
	    dto.setPickupLong(savedRide.getPickupLong());
	    dto.setDropLat(savedRide.getDropLat());
	    dto.setDropLong(savedRide.getDropLong());

	    dto.setVehicleType(vt);
	    dto.setDistanceKm(savedRide.getDistanceKm());
	    dto.setFare(savedRide.getFare());

	    dto.setUserName(user.getName());
	    dto.setUserPhone(user.getPhone());

	    dto.setDriverLat(driver.getLatitude());
	    dto.setDriverLong(driver.getLongitude());

	    dto.setDistanceToPickupKm(savedRide.getDistanceToPickupKm());

	    // OTP DRIVER KO NAHI DIKHANA
	    // dto.setOtp(savedRide.getOtp());

	    dto.setOtpVerified(savedRide.getOtpVerified());

	    return dto;
	}

	@Override
	public RideResponseDto getActiveRideForUser(Long userId) {
		List<RideEntity> rides = rideRepo.findActiveRidesForUser(
	            userId,
	            List.of(RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.ONGOING)
	    );

	    if (rides == null || rides.isEmpty()) {
	        throw new RuntimeException("No active ride found");
	    }

	    RideEntity ride = rides.get(0);

	    RideResponseDto dto = new RideResponseDto();
	    dto.setRideId(ride.getId());
	    dto.setUserId(ride.getUser().getId());
	    dto.setDriverId(ride.getDriver() != null ? ride.getDriver().getId() : null);
	    dto.setStatus(ride.getStatus().toString());

	    dto.setPickupLat(ride.getPickupLat());
	    dto.setPickupLong(ride.getPickupLong());
	    dto.setDropLat(ride.getDropLat());
	    dto.setDropLong(ride.getDropLong());

	    // use persisted trip distance first
	    double distanceKm = ride.getDistanceKm() != null
	            ? ride.getDistanceKm()
	            : haversineDistance(
	                    ride.getPickupLat(), ride.getPickupLong(),
	                    ride.getDropLat(), ride.getDropLong()
	              );

	    dto.setDistanceKm(distanceKm);

	    if (ride.getVehicleType() != null) {
	        dto.setVehicleType(ride.getVehicleType());

	        double fare = ride.getFare() != null
	                ? ride.getFare()
	                : calculateFare(distanceKm, ride.getVehicleType());

	        dto.setFare(fare);
	    }

	    dto.setOtp(ride.getOtp());

	    if (ride.getDriver() != null) {
	        dto.setDriverLat(ride.getDriver().getLatitude());
	        dto.setDriverLong(ride.getDriver().getLongitude());
	        dto.setDriverName(ride.getDriver().getName());
	        dto.setDriverPhone(ride.getDriver().getPhone());
	    }

	    return dto;
	}

	@Override
	public List<RideResponseDto> getAllRidesForUser(Long userId) {
		return rideRepo.findByUserId(userId).stream().map(ride -> {
			RideResponseDto dto = new RideResponseDto();

			dto.setRideId(ride.getId());
			dto.setUserId(ride.getUser().getId());
			dto.setDriverId(ride.getDriver() != null ? ride.getDriver().getId() : null);
			dto.setStatus(ride.getStatus().toString());

			dto.setPickupLat(ride.getPickupLat());
			dto.setPickupLong(ride.getPickupLong());
			dto.setDropLat(ride.getDropLat());
			dto.setDropLong(ride.getDropLong());

			double distanceKm = haversineDistance(ride.getPickupLat(), ride.getPickupLong(), ride.getDropLat(),
					ride.getDropLong());
			dto.setDistanceKm(distanceKm);

			if (ride.getVehicleType() != null) {
				dto.setVehicleType(ride.getVehicleType());
				dto.setFare(calculateFare(distanceKm, ride.getVehicleType()));
			}

			return dto;
		}).toList();
	}

	@Override
	public RideResponseDto verifyRideOtp(Long rideId, String otp) {
		
		 RideEntity ride = rideRepo.findById(rideId)
		            .orElseThrow(() -> new RuntimeException("Ride Not Found"));

		    if (ride.getStatus() != RideStatus.ACCEPTED) {
		        throw new RuntimeException("Ride must be in ACCEPTED state");
		    }

		    if (ride.getOtp() == null) {
		        throw new RuntimeException("OTP not generated for this ride");
		    }

		    if (!ride.getOtp().trim().equals(otp.trim())) {
		        throw new RuntimeException("Invalid OTP");
		    }

		    if (Boolean.TRUE.equals(ride.getOtpVerified())) {
		        throw new RuntimeException("OTP already verified");
		    }

		    ride.setOtpVerified(true);
		    ride.setStatus(RideStatus.ONGOING);

		    RideEntity savedRide = rideRepo.save(ride);

		    RideResponseDto dto = new RideResponseDto();
		    dto.setRideId(savedRide.getId());
		    dto.setUserId(savedRide.getUser().getId());
		    dto.setDriverId(savedRide.getDriver() != null ? savedRide.getDriver().getId() : null);
		    dto.setStatus(savedRide.getStatus().toString());

		    dto.setPickupLat(savedRide.getPickupLat());
		    dto.setPickupLong(savedRide.getPickupLong());
		    dto.setDropLat(savedRide.getDropLat());
		    dto.setDropLong(savedRide.getDropLong());

		    double distanceKm = haversineDistance(
		            savedRide.getPickupLat(),
		            savedRide.getPickupLong(),
		            savedRide.getDropLat(),
		            savedRide.getDropLong()
		    );
		    dto.setDistanceKm(distanceKm);

		    if (savedRide.getVehicleType() != null) {
		        dto.setVehicleType(savedRide.getVehicleType());
		        dto.setFare(calculateFare(distanceKm, savedRide.getVehicleType()));
		    }

		    dto.setOtpVerified(savedRide.getOtpVerified());
		    dto.setOtp(null);

		    return dto;
	}

	@Override
	public RideResponseDto currentRideByDriverId(Long driverId) {
		
		List<RideStatus> activeStatuses = Arrays.asList(
	            RideStatus.ACCEPTED,
	            RideStatus.STARTED,
	            RideStatus.ONGOING
	    );

	    RideEntity ride = rideRepo
	            .findFirstByDriver_IdAndStatusIn(driverId, activeStatuses)
	            .orElseThrow(() -> new RuntimeException("No active ride found for this driver"));

	    RideResponseDto dto = new RideResponseDto();

	    dto.setRideId(ride.getId());
	    dto.setStatus(ride.getStatus().toString());

	    double tripDistanceKm = ride.getDistanceKm() != null
	            ? ride.getDistanceKm()
	            : haversineDistance(
	                    ride.getPickupLat(), ride.getPickupLong(),
	                    ride.getDropLat(), ride.getDropLong()
	              );

	    dto.setDistanceKm(tripDistanceKm);

	    double fare = ride.getFare() != null
	            ? ride.getFare()
	            : calculateFare(tripDistanceKm, ride.getVehicleType());

	    dto.setFare(fare);

	    dto.setOtp(null);
	    dto.setOtpVerified(ride.getOtpVerified()); // sirf verified state bhejo, OTP nahi

	    dto.setPickupLat(ride.getPickupLat());
	    dto.setPickupLong(ride.getPickupLong());
	    dto.setDropLat(ride.getDropLat());
	    dto.setDropLong(ride.getDropLong());

	    DriverEntity driver = ride.getDriver();
	    if (driver != null) {
	        dto.setDriverId(driver.getId());
	        dto.setDriverName(driver.getName());
	        dto.setDriverPhone(driver.getPhone());
	        dto.setVehicleNumber(null);
	        dto.setDriverLat(driver.getLatitude());
	        dto.setDriverLong(driver.getLongitude());
	    }

	    UserEntity user = ride.getUser();
	    if (user != null) {
	        dto.setUserId(user.getId());
	        dto.setUserName(user.getName());
	        dto.setUserPhone(user.getPhone());
	    }

	    return dto;
	}

	@Override
	public RideResponseDto updateRideStatus(Long rideId, String status) {
		// TODO Auto-generated method stub
		return null;
	}
}
