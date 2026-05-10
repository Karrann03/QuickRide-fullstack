package com.kv.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class DriverLocation {

	private Long driverId;
    private Long rideId;
    private double lat;
    private double lng;
}
