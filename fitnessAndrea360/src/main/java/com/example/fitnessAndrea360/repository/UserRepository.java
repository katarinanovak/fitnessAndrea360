package com.example.fitnessAndrea360.repository;


import com.example.fitnessAndrea360.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.location WHERE u.email = :email")
    Optional<User> findByEmailWithLocation(@Param("email") String email);


    Optional<User> findByUsername(String username);

}