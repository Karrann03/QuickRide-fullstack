package com.kv.service.user;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.kv.dto.UserResponseDto;
import com.kv.entity.UserEntity;
import com.kv.repository.RideRepository;
import com.kv.repository.UserRepository;
import com.kv.role.AppRole;

@Service
public class UserServcieImpl implements IUserService {

	@Autowired
	private UserRepository userRepo;
	
	@Autowired
	private RideRepository rideRepo;
	

	@Override
	public String registerUser(UserEntity user) {
		user.setRole(AppRole.USER);
		 UserEntity user1 = userRepo.save(user);
		return user1.getId() + " Registered Successfully"; 
	}


	@Override
	public String loginUser(String email, String password) {
			UserEntity resp = userRepo.findByEmail(email)
			.filter(user -> user.getPassword().equals(password))
			.orElseThrow(()-> new RuntimeException("Invalid Credentials"));
		return "Login SuccessFully";
	}


	@Override
	public List<UserResponseDto> getAllUsers() {
		List<UserEntity> user = userRepo.findAll();
		return user.stream().map(this::convertToDto).toList();
	}
	
	public UserResponseDto convertToDto(UserEntity user) {
		
		UserResponseDto dto = new UserResponseDto();
		dto.setEmail(user.getEmail());
		dto.setName(user.getName());
		dto.setPhone(user.getPhone());
		
		return dto;
		
	}


	@Override
	public String cancelRide(Long userId, Long rideId) {
		
		rideRepo.findById(rideId).ifPresent(ride -> {
			if (ride.getUser().getId().equals(userId) && ( ride.getStatus() == com.kv.RideStatus.RideStatus.REQUESTED || ride.getStatus() == com.kv.RideStatus.RideStatus.ACCEPTED)) {
				ride.setStatus(com.kv.RideStatus.RideStatus.CANCELLED);
				rideRepo.save(ride);
			} else {
				throw new RuntimeException("Cannot cancel this ride");
			}
		});
		return "Ride Cancelled Successfully";
	}

}
