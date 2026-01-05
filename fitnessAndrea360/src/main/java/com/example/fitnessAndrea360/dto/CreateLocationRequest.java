package com.example.fitnessAndrea360.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateLocationRequest {

    @NotBlank(message = "Location name is required")
    private String name;

    @NotBlank(message = "Address is required")
    private String address;
}