package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.config.JwtService;
import com.example.fitnessAndrea360.dto.AuthResponse;
import com.example.fitnessAndrea360.dto.LoginRequest;
import com.example.fitnessAndrea360.model.User;
import com.example.fitnessAndrea360.repository.EmployeeRepository;
import com.example.fitnessAndrea360.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final EmployeeRepository employeeRepository;

    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for: {}", request.getEmail());

        try {
            // 1. Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // 2. Fetch User entity
            User user = userService.findUserByEmail(request.getEmail());

            // 3. Fetch Employee (if exists)
            Long locationId = null;
            String locationName = null;

            employeeRepository.findByUser(user).ifPresent(employee -> {
                if (employee.getLocation() != null) {
                    // mutable holders workaround
                }
            });

            var employeeOpt = employeeRepository.findByUser(user);
            if (employeeOpt.isPresent() && employeeOpt.get().getLocation() != null) {
                locationId = employeeOpt.get().getLocation().getId();
                locationName = employeeOpt.get().getLocation().getName();
            }

            // 4. Generate JWT
            String token = jwtService.generateToken(
                    userDetails,
                    user.getRole().getName()
            );

            // 5. Build response
            AuthResponse response = new AuthResponse(
                    token,
                    user.getEmail(),
                    user.getRole().getName(),
                    user.getId(),
                    locationId,
                    locationName
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Login error", e);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "Unauthorized",
                            "message", "Invalid email or password"
                    ));
        }
    }
}
