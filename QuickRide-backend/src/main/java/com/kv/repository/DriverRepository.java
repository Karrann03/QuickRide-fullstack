package com.kv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kv.RideStatus.DriverStatus;
import com.kv.RideStatus.VehicleType;
import com.kv.dto.neabyDto;
import com.kv.entity.DriverEntity;


@Repository
public interface DriverRepository extends JpaRepository<DriverEntity, Long> {

	 // All drivers that are currently available
    List<DriverEntity> findByStatus(DriverStatus status);

    // Available drivers filtered by vehicle type
    List<DriverEntity> findByStatusAndVehicleType(DriverStatus status,VehicleType vehicleType);
    
    
    // Find driver by email for authentication
    Optional<DriverEntity> findByEmail(String email);
}
