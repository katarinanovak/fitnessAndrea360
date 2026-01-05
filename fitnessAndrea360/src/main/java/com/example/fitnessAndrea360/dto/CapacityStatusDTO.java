package com.example.fitnessAndrea360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CapacityStatusDTO {

    private Long locationId;
    private String locationName;
    private LocalDate date;
    private Map<Integer, Long> appointmentsPerHour; // hour -> count
    private Integer totalAppointments;
    private Double averageUtilization;
}