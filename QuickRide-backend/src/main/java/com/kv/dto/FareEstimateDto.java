package com.kv.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class FareEstimateDto {
	
	private double pickupLat;
    private double pickupLong;
    private double dropLat;
    private double dropLong;
}
