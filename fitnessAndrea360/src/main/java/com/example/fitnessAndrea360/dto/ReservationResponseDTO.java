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
public class ReservationResponseDTO {

    private Long id;
    private Long appointmentId;
    private LocalDateTime appointmentStartTime;
    private LocalDateTime appointmentEndTime;
    private String serviceName;
    private String locationName;
    private Long memberId;
    private Long locationId;
    private String memberName;
    private Long purchaseId;
    private String purchaseName;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}