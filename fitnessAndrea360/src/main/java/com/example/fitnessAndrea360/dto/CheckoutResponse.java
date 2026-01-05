package com.example.fitnessAndrea360.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutResponse {
    private String sessionId;
    private String publicKey;
    private String checkoutUrl;
    private Long transactionId;
}