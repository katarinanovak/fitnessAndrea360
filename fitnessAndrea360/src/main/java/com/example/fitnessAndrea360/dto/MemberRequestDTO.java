package com.example.fitnessAndrea360.dto;

import com.example.fitnessAndrea360.model.Member;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MemberRequestDTO {

    @NotBlank(message = "Ime je obavezno")
    @Size(min = 2, max = 50, message = "Ime mora imati između 2 i 50 karaktera")
    private String firstName;

    @NotBlank(message = "Prezime je obavezno")
    @Size(min = 2, max = 50, message = "Prezime mora imati između 2 i 50 karaktera")
    private String lastName;

    @NotBlank(message = "Email je obavezan")
    @Email(message = "Email mora biti validan")
    private String email;

    @NotBlank(message = "Telefon je obavezan")
    @Pattern(regexp = "^\\+?[0-9\\s\\-]{8,20}$",
            message = "Telefon mora biti u validnom formatu (npr. +381641234567 ili 0641234567)")
    private String phone;

    @NotNull(message = "Datum rođenja je obavezan")
    @Past(message = "Datum rođenja mora biti u prošlosti")
    private LocalDate dateOfBirth;

    @NotNull(message = "Pol je obavezan")
    private Member.Gender gender;

    @NotBlank(message = "Adresa je obavezna")
    private String address;

    @NotNull(message = "ID lokacije je obavezan")
    @Min(value = 1, message = "ID lokacije mora biti validan")
    private Long locationId;

    private String emergencyContact;

    private String emergencyPhone;

    @NotNull(message = "Datum početka članstva je obavezan")
    @FutureOrPresent(message = "Datum početka mora biti danas ili u budućnosti")
    private LocalDate membershipStartDate;

    @NotNull(message = "Datum isteka članstva je obavezan")
    @Future(message = "Datum isteka mora biti u budućnosti")
    private LocalDate membershipEndDate;

    private String medicalNotes;

    private String notes;

    // Podaci za kreiranje User naloga
    @NotBlank(message = "Korisničko ime je obavezno")
    @Size(min = 3, max = 50, message = "Korisničko ime mora imati između 3 i 50 karaktera")
    private String username;

    @NotBlank(message = "Lozinka je obavezna")
    @Size(min = 6, message = "Lozinka mora imati najmanje 6 karaktera")
//    @Pattern(
//            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{6,}$",
//            message = "Lozinka mora sadržati: najmanje 6 karaktera, jedno veliko slovo, jedno malo slovo, jedan broj i jedan specijalni karakter"
//    )
    private String password;
}