package com.example.fitnessAndrea360.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequestDTO {

    @NotNull(message = "Usluga je obavezna")
    private Long serviceId;

    @NotNull(message = "Član je obavezan")
    private Long memberId;

   // @NotNull(message = "Lokacija je obavezna")
    private Long locationId;

    @NotNull(message = "Vreme početka je obavezno")
    @Future(message = "Termin mora biti u budućnosti")
    private LocalDateTime startTime;

    private String notes;
}