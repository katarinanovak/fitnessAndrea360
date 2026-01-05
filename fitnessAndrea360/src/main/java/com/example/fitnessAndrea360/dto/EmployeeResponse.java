package com.example.fitnessAndrea360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Long locationId;
    private String locationName;
    private boolean active;
    private LocalDateTime createdAt;
}