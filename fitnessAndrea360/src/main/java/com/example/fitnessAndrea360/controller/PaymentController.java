package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.CheckoutRequest;
import com.example.fitnessAndrea360.dto.CheckoutResponse;
import com.example.fitnessAndrea360.model.User;
import com.example.fitnessAndrea360.repository.UserRepository;
import com.example.fitnessAndrea360.service.StripeService;
import com.stripe.exception.StripeException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "API za plaćanje preko Stripe-a")
public class PaymentController {

    private final StripeService stripeService;
    private final UserRepository userRepository;

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Kreira Stripe Checkout sesiju")
    public ResponseEntity<CheckoutResponse> createCheckoutSession(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {

        log.info("Checkout zahtev primljen: serviceId={}, quantity={}",
                request.getServiceId(), request.getQuantity());

        // Izvuci username (email) iz tokena
        String username = authentication.getName();
        log.info("Korisnik iz tokena: {}", username);

        // Pronađi User po email-u
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    log.error("Korisnik nije pronađen sa email: {}", username);
                    return new RuntimeException("Korisnik nije pronađen");
                });

        log.info("Pronađen korisnik: id={}, email={}", user.getId(), user.getEmail());

        try {
            CheckoutResponse response = stripeService.createCheckoutSession(request, user.getId());
            log.info("Checkout sesija kreirana: {}", response.getSessionId());
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Greška pri kreiranju Stripe sesije", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Potvrda plaćanja",
            description = "Poziva se nakon uspešnog plaćanja da se kreira Purchase")
    public ResponseEntity<String> confirmPayment(@RequestParam String sessionId) {
        log.info("Potvrda plaćanja za sessionId={}", sessionId);

        try {
            stripeService.confirmPurchase(sessionId);
            log.info("Plaćanje potvrđeno za sessionId={}", sessionId);
            return ResponseEntity.ok("Plaćanje potvrđeno i purchase kreiran");
        } catch (Exception e) {
            log.error("Greška pri potvrdi plaćanja", e);
            return ResponseEntity.badRequest().body("Greška: " + e.getMessage());
        }
    }
}