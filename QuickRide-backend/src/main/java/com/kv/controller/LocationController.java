package com.kv.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.kv.dto.DriverLocation;

@Controller
public class LocationController {
    
	 // Driver sends their location update to this endpoint
	@MessageMapping("/location/update")
    @SendTo("/topic/ride/{rideId}")
    public DriverLocation updateLocation(@DestinationVariable Long rideId, DriverLocation loc) {
   
    	return loc;
    }
}
