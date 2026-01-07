package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.ServiceRequestDTO;
import com.example.fitnessAndrea360.dto.ServiceResponseDTO;
import com.example.fitnessAndrea360.exception.ResourceNotFoundException;
import com.example.fitnessAndrea360.model.Service;
import com.example.fitnessAndrea360.service.ServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/services")
@RequiredArgsConstructor
@Tag(name = "Service Management", description = "API za upravljanje uslugama/treningima")
@SecurityRequirement(name = "bearerAuth")
public class ServiceController {

    private final ServiceService serviceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Kreiraj novu uslugu/trening",
            description = "Samo admin i zaposleni mogu kreirati usluge. Zaposleni mogu kreirati usluge samo za svoju lokaciju.")
    public ResponseEntity<ServiceResponseDTO> createService(@Valid @RequestBody ServiceRequestDTO request) {
        ServiceResponseDTO createdService = serviceService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdService);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    public ResponseEntity<List<ServiceResponseDTO>> getAllServices() {
        List<ServiceResponseDTO> services = serviceService.getAllServices();
        return ResponseEntity.ok(services);
    }


    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    public ResponseEntity<List<ServiceResponseDTO>> getServicesByLocation(@PathVariable Long locationId) {
        List<ServiceResponseDTO> services = serviceService.getServicesByLocation(locationId);
        return ResponseEntity.ok(services);
    }


}