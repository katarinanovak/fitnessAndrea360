package com.example.fitnessAndrea360.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ServiceRequestDTO {

    @NotBlank(message = "Naziv usluge je obavezan")
    private String name;

    private String description;

    @NotNull(message = "Cena je obavezna")
    @Positive(message = "Cena mora biti pozitivna")
    private BigDecimal priceEur;

    @NotNull(message = "Trajanje je obavezno")
    @Positive(message = "Trajanje mora biti pozitivno")
    private Integer durationMinutes;

    @NotNull(message = "Kapacitet je obavezan")
    @Positive(message = "Kapacitet mora biti pozitivan")
    private Integer maxCapacity;

    // Lista ID-jeva lokacija gde je usluga dostupna
    @NotNull(message = "Morate izabrati bar jednu lokaciju")
    private List<Long> locationIds;
}