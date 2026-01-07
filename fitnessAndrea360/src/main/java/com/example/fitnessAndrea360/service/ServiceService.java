package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.ServiceRequestDTO;
import com.example.fitnessAndrea360.dto.ServiceResponseDTO;
import com.example.fitnessAndrea360.exception.ResourceNotFoundException;
import com.example.fitnessAndrea360.exception.UnauthorizedAccessException;
import com.example.fitnessAndrea360.exception.ValidationException;
import com.example.fitnessAndrea360.model.Location;
import com.example.fitnessAndrea360.model.Service;
import com.example.fitnessAndrea360.model.User;
import com.example.fitnessAndrea360.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    //pomoćna metoda za dobijanje trenutnog User entiteta SA LOKACIJOM
    private User getCurrentUserWithLocation() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        // Učitaj korisnika SA lokacijom
        return userRepository.findByEmailWithLocation(email)
                .orElseThrow(() -> new RuntimeException("Trenutni korisnik nije pronađen u bazi"));
    }


    private Long getLocationIdFromToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Pokušaj da dobiješ locationId iz authentication details (ako si ga postavila u JwtAuthenticationFilter)
        if (authentication.getDetails() instanceof Map) {
            Map<?, ?> details = (Map<?, ?>) authentication.getDetails();
            Object locationIdObj = details.get("locationId");
            if (locationIdObj instanceof Long) {
                return (Long) locationIdObj;
            } else if (locationIdObj instanceof Integer) {
                return ((Integer) locationIdObj).longValue();
            }
        }

        // Ako nema u details, vrati null
        return null;
    }

    @Transactional
    public ServiceResponseDTO createService(ServiceRequestDTO request) {
        // 1. Validacija - provera da li već postoji usluga sa istim imenom na nekoj od lokacija
        for (Long locationId : request.getLocationIds()) {
            if (serviceRepository.existsByNameAndLocationsId(request.getName(), locationId)) {
                throw new ValidationException(
                        "Usluga sa imenom '" + request.getName() + "' već postoji na lokaciji ID: " + locationId
                );
            }
        }

        // 2. Dobijanje trenutno prijavljenog korisnika SA LOKACIJOM
        User currentUser = getCurrentUserWithLocation();

        // 3. Ako je EMPLOYEE, automatski koristi NJEGOVU lokaciju
        List<Long> targetLocationIds;
        if (currentUser.getRole().getName().equals("EMPLOYEE")) {
            // Prvo pokušaj da dobiješ locationId iz tokena
            Long tokenLocationId = getLocationIdFromToken();

            // Odredi koji locationId koristiti
            Long employeeLocationId;
            if (tokenLocationId != null) {
                // Koristi locationId iz tokena
                employeeLocationId = tokenLocationId;
            } else if (currentUser.getLocation() != null) {
                // Koristi locationId iz baze
                employeeLocationId = currentUser.getLocation().getId();
            } else {
                throw new UnauthorizedAccessException("Zaposleni nema dodeljenu lokaciju");
            }

            // Employee MORA da kreira uslugu za SVOJU lokaciju
            targetLocationIds = List.of(employeeLocationId);

            // IGNORIŠI locationIds iz requesta i koristi zaposlenog lokaciju
            // Ovo osigurava da employee ne može kreirati uslugu za drugu lokaciju
            System.out.println("Employee creating service for their location ID: " + employeeLocationId);

        } else if (currentUser.getRole().getName().equals("ADMIN")) {
            // Admin može da bira lokacije
            targetLocationIds = request.getLocationIds();
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo da kreiraš usluge");
        }

        // 4. Dobijanje lokacija
        List<Location> locations = locationRepository.findAllById(targetLocationIds);
        if (locations.size() != targetLocationIds.size()) {
            throw new ResourceNotFoundException("Neke od lokacija nisu pronađene");
        }

        // 5. Kreiranje Service entiteta
        Service service = new Service();
        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setPriceEur(request.getPriceEur());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setMaxCapacity(request.getMaxCapacity());
        service.setIsActive(true);
        service.setLocations(new java.util.HashSet<>(locations));
        service.setCreatedBy(currentUser);

        Service savedService = serviceRepository.save(service);

        return mapToResponse(savedService);
    }

    public List<ServiceResponseDTO> getAllServices() {
        User currentUser = getCurrentUserWithLocation();

        List<Service> services;

        if (currentUser.getRole().getName().equals("ADMIN")) {
            // Admin vidi sve usluge
            services = serviceRepository.findAll();
        } else if (currentUser.getRole().getName().equals("EMPLOYEE")) {
            // Employee vidi usluge samo sa svoje lokacije
            Long employeeLocationId = getEmployeeLocationId(currentUser);
            services = serviceRepository.findByLocationsId(employeeLocationId);
        } else if (currentUser.getRole().getName().equals("MEMBER")) {
            // Member vidi usluge samo sa svoje lokacije
            if (currentUser.getLocation() == null) {
                throw new UnauthorizedAccessException("Član nema dodeljenu lokaciju");
            }
            services = serviceRepository.findByLocationsId(currentUser.getLocation().getId());
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo pristupa");
        }

        return services.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ServiceResponseDTO> getServicesByLocation(Long locationId) {
        User currentUser = getCurrentUserWithLocation();

        // Provera prava pristupa
        if (!currentUser.getRole().getName().equals("ADMIN") &&
                !(currentUser.getRole().getName().equals("EMPLOYEE") &&
                        getEmployeeLocationId(currentUser).equals(locationId)) &&
                !(currentUser.getRole().getName().equals("MEMBER") &&
                        currentUser.getLocation() != null &&
                        currentUser.getLocation().getId().equals(locationId))) {
            throw new UnauthorizedAccessException("Nemaš pravo da vidiš usluge ove lokacije");
        }

        List<Service> services = serviceRepository.findByLocationsId(locationId);
        return services.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Pomoćna metoda za dobijanje employee-ove lokacije
    private Long getEmployeeLocationId(User employee) {
        // Prvo pokušaj iz tokena
        Long tokenLocationId = getLocationIdFromToken();
        if (tokenLocationId != null) {
            return tokenLocationId;
        }

        // Ako nema u tokenu, proveri bazu
        if (employee.getLocation() == null) {
            throw new UnauthorizedAccessException("Zaposleni nema dodeljenu lokaciju");
        }
        return employee.getLocation().getId();
    }

    private ServiceResponseDTO mapToResponse(Service service) {
        return ServiceResponseDTO.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .priceEur(service.getPriceEur())
                .durationMinutes(service.getDurationMinutes())
                .maxCapacity(service.getMaxCapacity())
                .isActive(service.getIsActive())
                .locationIds(service.getLocations().stream()
                        .map(Location::getId)
                        .collect(Collectors.toList()))
                .locationNames(service.getLocations().stream()
                        .map(Location::getName)
                        .collect(Collectors.toList()))
                .createdById(service.getCreatedBy() != null ? service.getCreatedBy().getId() : null)
                .createdByName(service.getCreatedBy() != null ?
                        service.getCreatedBy().getFirstName() + " " + service.getCreatedBy().getLastName() : null)
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }
}