package com.example.fitnessAndrea360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponseDTO {

    private Long id;
    private Long serviceId;
    private String serviceName;
    private BigDecimal servicePrice;
    private Integer durationMinutes;
    private Integer maxCapacity;
    private Integer currentCapacity;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private Long locationId;
    private String locationName;
    private Long createdById;
    private String createdByName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}