package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.CreateLocationRequest;
import com.example.fitnessAndrea360.dto.LocationResponse;
import com.example.fitnessAndrea360.exception.ResourceNotFoundException;
import com.example.fitnessAndrea360.model.Location;
import com.example.fitnessAndrea360.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    @Transactional
    public LocationResponse createLocation(CreateLocationRequest request) {
        Location location = new Location();
        location.setName(request.getName());
        location.setAddress(request.getAddress());

        Location saved = locationRepository.save(location);
        return mapToResponse(saved);
    }

    public List<LocationResponse> getAllLocations() {
        return locationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LocationResponse getLocationById(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        return mapToResponse(location);
    }

    @Transactional
    public LocationResponse updateLocation(Long id, CreateLocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));

        location.setName(request.getName());
        location.setAddress(request.getAddress());

        Location updated = locationRepository.save(location);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteLocation(Long id) {
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Location not found with id: " + id);
        }
        locationRepository.deleteById(id);
    }

    private LocationResponse mapToResponse(Location location) {
        LocationResponse response = new LocationResponse();
        response.setId(location.getId());
        response.setName(location.getName());
        response.setAddress(location.getAddress());
        return response;
    }
}