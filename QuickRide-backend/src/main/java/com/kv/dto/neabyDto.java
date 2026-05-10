package com.kv.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class neabyDto {
	
	private Long id;
	private String name;
	private Double latitude;
	private Double longitude;
	private String vehicleType;
	private String status;
}
