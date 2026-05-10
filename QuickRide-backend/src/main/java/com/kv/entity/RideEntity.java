package com.kv.entity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kv.RideStatus.DriverStatus;
import com.kv.RideStatus.RideStatus;
import com.kv.RideStatus.VehicleType;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "Ride_Entity")
@Data
public class RideEntity {

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_long")
    private Double pickupLong;

    @Column(name = "drop_lat")
    private Double dropLat;

    @Column(name = "drop_long")
    private Double dropLong;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RideStatus status;
    
    @Column(name = "fare")
    private Double fare;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "Driver_status")
    private DriverStatus driverStatus;
    
    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
    private LocalDateTime startedAt;
    
    @Column(name = "otp")
    private String otp;

    @Column(name = "otp_verified")
    private Boolean otpVerified;

    @Column(name = "driver_lat")
    private Double driverLat;

    @Column(name = "driver_long")
    private Double driverLong;
    
    @Column(name = "distance_km")
    private Double distanceKm;
    
    @Column(name = "distance_to_pickup_km")
    private Double distanceToPickupKm;
    
 // === ASSOCIATIONS ===
    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", referencedColumnName = "id")
    @JsonIgnore
    private DriverEntity driver;
    
    @ElementCollection
    private Set<Long> rejectedDriverIds = new HashSet();
}

	
