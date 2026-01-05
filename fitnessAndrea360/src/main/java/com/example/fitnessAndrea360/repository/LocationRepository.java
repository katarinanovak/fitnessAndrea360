package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}
