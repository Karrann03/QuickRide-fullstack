package com.kv.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class FareEstimateResponseDto {

	private double distanceKm;
	private List<VehicleFareDto> fares;
}
