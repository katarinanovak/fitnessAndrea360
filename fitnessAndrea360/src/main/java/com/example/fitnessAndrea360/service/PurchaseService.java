package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.PurchaseResponseDTO;
import com.example.fitnessAndrea360.model.Member;
import com.example.fitnessAndrea360.model.Purchase;
import com.example.fitnessAndrea360.model.Service;
import com.example.fitnessAndrea360.model.User;
import com.example.fitnessAndrea360.repository.MemberRepository;
import com.example.fitnessAndrea360.repository.PurchaseRepository;
import com.example.fitnessAndrea360.repository.ServiceRepository;
import com.example.fitnessAndrea360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Transactional
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final MemberRepository memberRepository; // DODAJ OVO
    private final ServiceRepository serviceRepository; // DODAJ OVO
    private final UserRepository userRepository;

    /**
     * Vrati sve kupovine trenutno ulogovanog člana
     */
    public List<PurchaseResponseDTO> getCurrentMemberPurchases() {
        try {
            // 1. Dobavi trenutnog korisnika
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = authentication.getName();

            System.out.println("🔍 Current username: " + currentUsername);

            // 2. Pokušaj da pronađeš Member-a na različite načine
            Member member = null;

            // Prvo pokušaj po username-u
            Optional<Member> memberByUsername = memberRepository.findByUserUsername(currentUsername);
            if (memberByUsername.isPresent()) {
                member = memberByUsername.get();
                System.out.println("✅ Found member by username: " + member.getFirstName());
            }
            // Ako ne radi, pokušaj po email-u
            else if (currentUsername.contains("@")) {
                Optional<Member> memberByEmail = memberRepository.findByUserEmail(currentUsername);
                if (memberByEmail.isPresent()) {
                    member = memberByEmail.get();
                    System.out.println("✅ Found member by email: " + member.getFirstName());
                }
            }
            // Ako ni to ne radi, pokušaj pronaći User pa onda Member
            else {
                Optional<User> user = userRepository.findByUsername(currentUsername);
                if (user.isPresent()) {
                    Optional<Member> memberByUserId = memberRepository.findByUserId(user.get().getId());
                    if (memberByUserId.isPresent()) {
                        member = memberByUserId.get();
                        System.out.println("✅ Found member by user ID: " + member.getFirstName());
                    }
                }
            }

            if (member == null) {
                System.out.println("⚠️ Member not found for username: " + currentUsername);
                // Vrati praznu listu umesto da baci exception
                return Collections.emptyList();
            }

            System.out.println("👤 Member ID: " + member.getId() + ", Name: " + member.getFirstName());

            // 3. Dobavi sve purchase-e za ovog member-a
            List<Purchase> purchases = purchaseRepository.findByMemberId(member.getId());

            System.out.println("📦 Found " + purchases.size() + " purchases");

            // 4. Konvertuj u DTO
            return purchases.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("❌ Error in getCurrentMemberPurchases: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList(); // Vrati praznu listu umesto da pukne
        }
    }

    /**
     * Vrati kupovinu po ID-u
     */
    public PurchaseResponseDTO getPurchaseById(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + id));

        return convertToDTO(purchase);
    }

    /**
     * Vrati sve aktivne kupovine za člana (remainingUses > 0)
     */
    public List<PurchaseResponseDTO> getActivePurchasesForCurrentMember() {
        try {
            List<PurchaseResponseDTO> allPurchases = getCurrentMemberPurchases();

            return allPurchases.stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus()) && p.getRemainingUses() > 0)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("❌ Error in getActivePurchasesForCurrentMember: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Vrati kupovine za određeni servis
     */
    public List<PurchaseResponseDTO> getPurchasesByServiceId(Long serviceId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = authentication.getName();

            // Pronađi member-a
            Member member = findMemberByUsername(currentUsername);
            if (member == null) {
                return Collections.emptyList();
            }

            // Prvo pokušaj sa repository metodom ako postoji
            try {
                List<Purchase> purchases = purchaseRepository.findByMemberIdAndServiceId(member.getId(), serviceId);
                return purchases.stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
            } catch (Exception e) {
                // Ako metoda ne postoji, filtriraj ručno
                System.out.println("⚠️ Using manual filter for purchases");
                List<Purchase> allPurchases = purchaseRepository.findByMemberId(member.getId());

                return allPurchases.stream()
                        .filter(p -> p.getService().getId().equals(serviceId))
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("❌ Error in getPurchasesByServiceId: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Smanji remainingUses za 1 (kada se napravi rezervacija)
     */
    @Transactional
    public PurchaseResponseDTO useOneSession(Long purchaseId) {
        try {
            Purchase purchase = purchaseRepository.findById(purchaseId)
                    .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + purchaseId));

            if (purchase.getRemainingUses() <= 0) {
                throw new RuntimeException("No remaining uses for purchase ID: " + purchaseId);
            }

            // Smanji remainingUses za 1
            purchase.setRemainingUses(purchase.getRemainingUses() - 1);

            // Ako je iskorišćeno sve, promeni status
            if (purchase.getRemainingUses() == 0) {
                purchase.setStatus(Purchase.Status.USED);
            }

            Purchase savedPurchase = purchaseRepository.save(purchase);

            System.out.println("➖ Used one session from purchase ID: " + purchaseId +
                    ", Remaining: " + savedPurchase.getRemainingUses());

            return convertToDTO(savedPurchase);
        } catch (Exception e) {
            System.err.println("❌ Error in useOneSession: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Kreiraj novu kupovinu (kada se kupi preko Stripe-a)
     */
    @Transactional
    public PurchaseResponseDTO createPurchase(Long memberId, Long serviceId, Integer quantity, BigDecimal totalPrice) {
        try {
            // 1. Dobavi Member ENTITET (ne DTO)
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Member not found with id: " + memberId));

            // 2. Dobavi Service ENTITET (ne DTO)
            Service service = serviceRepository.findById(Math.toIntExact(serviceId))
                    .orElseThrow(() -> new RuntimeException("Service not found with id: " + serviceId));

            Purchase purchase = new Purchase();
            purchase.setMember(member);
            purchase.setService(service);
            purchase.setQuantity(quantity);
            purchase.setRemainingUses(quantity); // Na početku sve su dostupne
            purchase.setTotalPriceEur(totalPrice);
            purchase.setPurchaseDate(LocalDate.now());
            purchase.setStatus(Purchase.Status.ACTIVE);

            // Postavi expiry date (npr. za 30 dana)
            purchase.setExpiryDate(LocalDate.now().plusDays(30));

            Purchase savedPurchase = purchaseRepository.save(purchase);

            System.out.println("➕ Created new purchase ID: " + savedPurchase.getId() +
                    " for member: " + member.getFirstName() + " " + member.getLastName() +
                    ", service: " + service.getName() +
                    ", remaining uses: " + savedPurchase.getRemainingUses());

            return convertToDTO(savedPurchase);
        } catch (Exception e) {
            System.err.println("❌ Error in createPurchase: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Pomocna metoda za pronalaženje member-a po username-u
     */
    private Member findMemberByUsername(String username) {
        Optional<Member> memberByUsername = memberRepository.findByUserUsername(username);
        if (memberByUsername.isPresent()) {
            return memberByUsername.get();
        }

        if (username.contains("@")) {
            Optional<Member> memberByEmail = memberRepository.findByUserEmail(username);
            if (memberByEmail.isPresent()) {
                return memberByEmail.get();
            }
        }

        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            Optional<Member> memberByUserId = memberRepository.findByUserId(user.get().getId());
            if (memberByUserId.isPresent()) {
                return memberByUserId.get();
            }
        }

        return null;
    }

    /**
     * Konvertuj Purchase entitet u DTO
     */
    private PurchaseResponseDTO convertToDTO(Purchase purchase) {
        return PurchaseResponseDTO.builder()
                .id(purchase.getId())
                .memberId(purchase.getMember().getId())
                .memberName(purchase.getMember().getFirstName() + " " + purchase.getMember().getLastName())
                .serviceId(purchase.getService().getId())
                .serviceName(purchase.getService().getName())
                .quantity(purchase.getQuantity())
                .remainingUses(purchase.getRemainingUses())
                .totalPriceEur(purchase.getTotalPriceEur())
                .purchaseDate(purchase.getPurchaseDate())
                .expiryDate(purchase.getExpiryDate())
                .status(purchase.getStatus().name())
                .createdAt(purchase.getCreatedAt())
                .updatedAt(purchase.getUpdatedAt())
                .build();
    }
}