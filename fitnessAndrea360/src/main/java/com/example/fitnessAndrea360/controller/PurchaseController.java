package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.PurchaseResponseDTO;
import com.example.fitnessAndrea360.service.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchase Management", description = "API za upravljanje kupovinama")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping("/member/current")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Dohvati kupovine trenutnog člana",
            description = "Vraća sve kupovine trenutno ulogovanog člana")
    public ResponseEntity<List<PurchaseResponseDTO>> getCurrentMemberPurchases() {
        List<PurchaseResponseDTO> purchases = purchaseService.getCurrentMemberPurchases();
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Dohvati aktivne kupovine",
            description = "Vraća samo aktivne kupovine sa preostalim sesijama")
    public ResponseEntity<List<PurchaseResponseDTO>> getActivePurchases() {
        List<PurchaseResponseDTO> purchases = purchaseService.getActivePurchasesForCurrentMember();
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati kupovinu po ID-u")
    public ResponseEntity<PurchaseResponseDTO> getPurchaseById(@PathVariable Long id) {
        PurchaseResponseDTO purchase = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(purchase);
    }

    @GetMapping("/service/{serviceId}")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Dohvati kupovine za servis",
            description = "Vraća sve kupovine trenutnog člana za određeni servis")
    public ResponseEntity<List<PurchaseResponseDTO>> getPurchasesByServiceId(@PathVariable Long serviceId) {
        List<PurchaseResponseDTO> purchases = purchaseService.getPurchasesByServiceId(serviceId);
        return ResponseEntity.ok(purchases);
    }

    @PostMapping("/{purchaseId}/use")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Iskoristi jednu sesiju",
            description = "Smanjuje remainingUses za 1 kada se napravi rezervacija")
    public ResponseEntity<PurchaseResponseDTO> useOneSession(@PathVariable Long purchaseId) {
        PurchaseResponseDTO purchase = purchaseService.useOneSession(purchaseId);
        return ResponseEntity.ok(purchase);
    }

    @GetMapping("/test")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Test endpoint",
            description = "Testira da li purchase endpoint radi")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Purchase controller is working!");
    }
}