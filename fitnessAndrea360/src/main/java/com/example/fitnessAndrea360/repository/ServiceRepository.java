package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Location;
import com.example.fitnessAndrea360.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Integer> {


    List<Service> findByLocationsId(Long locationId);

    List<Service> findByCreatedById(Long userId);

    boolean existsByNameAndLocationsId(String name, Long locationId);
    List<Service> findByLocationsContains(Location location);
}
