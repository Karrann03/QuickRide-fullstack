package com.kv.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDto {

    private Long id;
    private String role;   // USER or DRIVER
    private String message;
    private String token;
}
