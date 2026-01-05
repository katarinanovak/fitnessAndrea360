package com.example.fitnessAndrea360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponseDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal priceEur;
    private Integer durationMinutes;
    private Integer maxCapacity;
    private Boolean isActive;
    private List<Long> locationIds;
    private List<String> locationNames;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}