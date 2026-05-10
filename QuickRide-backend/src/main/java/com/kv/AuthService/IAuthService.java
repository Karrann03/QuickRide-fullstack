package com.kv.AuthService;

import com.kv.dto.LoginRequestDto;
import com.kv.dto.LoginResponseDto;

public interface IAuthService {
	
	public LoginResponseDto login(LoginRequestDto request);
}
