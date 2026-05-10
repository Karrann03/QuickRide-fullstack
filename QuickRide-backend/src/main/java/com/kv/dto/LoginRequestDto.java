package com.kv.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class LoginRequestDto {
	
	    private Long id;
	    private String role; // USER or DRIVER
	    private String message;
	    private String password;
	    private String email;
}
