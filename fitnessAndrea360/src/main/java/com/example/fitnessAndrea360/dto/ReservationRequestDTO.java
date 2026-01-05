package com.example.fitnessAndrea360.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReservationRequestDTO {

    @NotNull(message = "Termin je obavezan")
    private Long appointmentId;

    @NotNull(message = "Kupovina je obavezna")
    private Long purchaseId;

    private String notes;
}