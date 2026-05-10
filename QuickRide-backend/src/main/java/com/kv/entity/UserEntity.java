package com.kv.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

import com.kv.role.AppRole;

@Entity
@Table(name = "user_entity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "email",unique = true)
    private String email;
    
    @Column(name = "password")
    private String password;

    @Column(name = "phone")
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppRole role;

    // === ASSOCIATION: One user can have many rides ===
    @OneToMany(mappedBy = "user")
    private List<RideEntity> rides;
}
