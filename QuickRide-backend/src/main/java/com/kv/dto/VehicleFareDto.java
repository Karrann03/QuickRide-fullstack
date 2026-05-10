package com.kv.dto;

import com.kv.RideStatus.VehicleType;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class VehicleFareDto {

	private VehicleType vehicleType;
    private double fare;
}
