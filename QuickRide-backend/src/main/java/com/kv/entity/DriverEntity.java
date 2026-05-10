package com.kv.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kv.RideStatus.DriverStatus;
import com.kv.RideStatus.VehicleType;
import com.kv.role.AppRole;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "driver_entity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverEntity {
	
	

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "email",unique = true)
    private String email;
    
    @Column(name = "password")
    private String password;

    @Column(name = "phone")
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DriverStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;

    // === ASSOCIATION: One driver can have many rides ===
    @OneToMany(mappedBy = "driver", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<RideEntity> rides;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppRole role;

    @Column(name="current_lat")
    private Double latitude;

    @Column(name="current_long")
    private Double longitude;
    
   
}
