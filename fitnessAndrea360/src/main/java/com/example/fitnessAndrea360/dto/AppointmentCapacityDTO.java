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
public class AppointmentCapacityDTO {
    private Long appointmentId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String serviceName;
    private Integer maxCapacity;
    private Integer currentCapacity;
    private Integer availableSpaces;
}