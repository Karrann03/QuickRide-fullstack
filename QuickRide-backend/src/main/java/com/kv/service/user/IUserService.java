package com.kv.service.user;

import java.util.List;

import com.kv.dto.UserResponseDto;
import com.kv.entity.UserEntity;

public interface IUserService {

	String registerUser(UserEntity user);
	String loginUser(String email, String password);
	List<UserResponseDto> getAllUsers();
	String cancelRide(Long userId, Long rideId);
}
