package com.kv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kv.entity.RideRejection;

@Repository
public interface RideRejectionRepository extends JpaRepository<RideRejection, Long> {

	Boolean existsByRideIdAndDriverId(Long rideId, Long driverId);
}
