package com.example.fitnessAndrea360.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateEmployeeRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Location ID is required")
    private Long locationId;

    private String phone; // DODAJTE OVO AKO TREBA
    private String position; // DODAJTE OVO AKO TREBA
    private Double salaryEur; // DODAJTE OVO AKO TREBA
}