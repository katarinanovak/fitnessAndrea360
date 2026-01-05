package com.example.fitnessAndrea360.dto;

import com.example.fitnessAndrea360.model.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private Member.Gender gender;
    private String address;
    private String emergencyContact;
    private String emergencyPhone;
    private LocalDate membershipStartDate;
    private LocalDate membershipEndDate;
    private Member.MembershipStatus membershipStatus;
    private String medicalNotes;
    private String notes;
    private Long locationId;
    private String locationName;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long userId;
    private String username;
}