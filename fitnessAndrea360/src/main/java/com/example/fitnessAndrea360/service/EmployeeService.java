package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.CreateEmployeeRequest;
import com.example.fitnessAndrea360.dto.EmployeeResponse;
import com.example.fitnessAndrea360.exception.ResourceNotFoundException;
import com.example.fitnessAndrea360.model.*;
import com.example.fitnessAndrea360.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final LocationRepository locationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        // 1. Proveri da li email već postoji
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // 2. Pronađi lokaciju
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Location", "id", request.getLocationId()
                ));

        // 3. Pronađi EMPLOYEE rolu
        Role employeeRole = roleRepository.findByName("EMPLOYEE")
                .orElseThrow(() -> new ResourceNotFoundException("EMPLOYEE role not found"));

        // 4. Kreiraj User-a
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(employeeRole);
        user.setIsActive(true); // PROMENJENO
        user.setFirstName(request.getFirstName()); // DODAJTE
        user.setLastName(request.getLastName()); // DODAJTE
        user.setLocation(location); // DODAJTE
        User savedUser = userRepository.save(user);

        // 5. Kreiraj Employee-a
        Employee employee = new Employee();
        employee.setUser(savedUser);
        employee.setLocation(location);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPhone(request.getPhone()); // DODAJTE
        employee.setPosition(request.getPosition()); // DODAJTE
        employee.setSalaryEur(request.getSalaryEur()); // DODAJTE
        employee.setHireDate(java.time.LocalDate.now()); // DODAJTE

        Employee savedEmployee = employeeRepository.save(employee);

        return mapToResponse(savedEmployee);
    }

    public List<EmployeeResponse> getAllEmployees(Long locationId) {
        List<Employee> employees;

        if (locationId != null) {
            employees = employeeRepository.findByLocationId(locationId);
        } else {
            employees = employeeRepository.findAll();
        }

        return employees.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return mapToResponse(employee);
    }

    public EmployeeResponse getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "user id", userId));
        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse assignToLocation(Long employeeId, Long locationId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", locationId));

        employee.setLocation(location);
        Employee updatedEmployee = employeeRepository.save(employee);

        return mapToResponse(updatedEmployee);
    }

    @Transactional
    public void deactivateEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        employee.getUser().setIsActive(false); // PROMENJENO
        userRepository.save(employee.getUser());
    }

    @Transactional
    public void activateEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        employee.getUser().setIsActive(true); // PROMENJENO
        userRepository.save(employee.getUser());
    }

    private EmployeeResponse mapToResponse(Employee employee) {
        return EmployeeResponse.builder()
                .id(employee.getId())
                .email(employee.getUser().getEmail())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .locationId(employee.getLocation().getId())
                .locationName(employee.getLocation().getName())
                .active(employee.getUser().getIsActive()) // PROMENJENO SA getEnabled() NA getIsActive()
                .createdAt(employee.getCreatedAt())
                .build();
    }
}