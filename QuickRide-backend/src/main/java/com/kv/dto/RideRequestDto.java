package com.kv.dto;


import com.kv.RideStatus.VehicleType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RideRequestDto {
	
    private Double pickupLat;
    private Double pickupLong;
    private Double dropLat;
    private Double dropLong;
    private Long userId;
    private VehicleType vehicleType;
}

