// src/main/java/com/example/fitnessAndrea360/dto/PurchaseResponseDTO.java
package com.example.fitnessAndrea360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseResponseDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long serviceId;
    private String serviceName;
    private Integer quantity;
    private Integer remainingUses;
    private BigDecimal totalPriceEur;
    private LocalDate purchaseDate;
    private LocalDate expiryDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}