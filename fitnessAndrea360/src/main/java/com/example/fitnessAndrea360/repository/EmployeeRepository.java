package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Employee;
import com.example.fitnessAndrea360.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByUserId(Long userId);

    List<Employee> findByLocationId(Long locationId);
    Optional<Employee> findByUser(User user);

    @Query("SELECT e FROM Employee e WHERE e.user.email = :email")
    Optional<Employee> findByUserEmail(@Param("email") String email);

    boolean existsByUserId(Long userId);

    boolean existsByUserEmail(String email);
}