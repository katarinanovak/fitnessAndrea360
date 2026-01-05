package com.example.fitnessAndrea360.service;

import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.example.fitnessAndrea360.dto.CheckoutRequest;
import com.example.fitnessAndrea360.dto.CheckoutResponse;
import com.example.fitnessAndrea360.model.*;
import com.example.fitnessAndrea360.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class StripeService {

    @Value("${stripe.public.key}")
    private String stripePublicKey;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final ServiceRepository serviceRepository;
    private final MemberRepository memberRepository;
    private final TransactionRepository transactionRepository;
    private final PurchaseRepository purchaseRepository;

    @Transactional
    public CheckoutResponse createCheckoutSession(CheckoutRequest request, Long userId) throws StripeException {
        log.info("Kreiranje checkout sesije za user_id={}, service_id={}", userId, request.getServiceId());

        // 1. Validacija - pronađi člana po user.id
        Member member = memberRepository.findByUser_Id(userId)
                .orElseThrow(() -> {
                    log.error("Član nije pronađen za user_id={}", userId);
                    return new RuntimeException("Član nije pronađen");
                });

        log.info("Pronađen član: id={}, ime={} {}", member.getId(), member.getFirstName(), member.getLastName());

        Service service = serviceRepository.findById(Math.toIntExact(request.getServiceId()))
                .orElseThrow(() -> {
                    log.error("Usluga nije pronađena sa id={}", request.getServiceId());
                    return new RuntimeException("Usluga nije pronađena");
                });

        // 2. Izračunaj cenu
        BigDecimal unitPrice = service.getPriceEur();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));
        log.info("Cena: {} x {} = {}", unitPrice, request.getQuantity(), totalPrice);

        // 3. Kreiraj pending Transaction
        Transaction transaction = new Transaction();
        transaction.setAmountEur(totalPrice);
        transaction.setStatus(Transaction.Status.PENDING);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction = transactionRepository.save(transaction);
        log.info("Kreirana transakcija: id={}", transaction.getId());

        // 4. Kreiraj Stripe Checkout Session
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/payment/cancel")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity((long) request.getQuantity())
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("eur")
                                                .setUnitAmountDecimal(totalPrice.multiply(BigDecimal.valueOf(100))) // u centima
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(service.getName())
                                                                .setDescription(service.getDescription())
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .putMetadata("member_id", member.getId().toString())
                .putMetadata("service_id", service.getId().toString())
                .putMetadata("quantity", request.getQuantity().toString())
                .putMetadata("transaction_id", transaction.getId().toString())
                .build();

        Session session = Session.create(params);
        log.info("Stripe sesija kreirana: {}", session.getId());

        // 5. Ažuriraj Transaction sa Stripe session ID
        transaction.setStripePaymentIntentId(session.getId());
        transactionRepository.save(transaction);

        // 6. Vrati response
        return CheckoutResponse.builder()
                .sessionId(session.getId())
                .publicKey(stripePublicKey)
                .checkoutUrl(session.getUrl())
                .transactionId(transaction.getId())
                .build();
    }

    @Transactional
    public void confirmPurchase(String sessionId) throws StripeException {
        log.info("Potvrda plaćanja za session_id={}", sessionId);

        // 1. Dohvati sesiju sa Stripe-a
        Session session = Session.retrieve(sessionId);

        // 2. Proveri da li je plaćeno
        if (!"paid".equals(session.getPaymentStatus())) {
            log.error("Plaćanje nije uspešno za session_id={}", sessionId);
            throw new RuntimeException("Plaćanje nije uspešno");
        }

        // 3. Dohvati metadata
        String memberIdStr = session.getMetadata().get("member_id");
        String serviceIdStr = session.getMetadata().get("service_id");
        String quantityStr = session.getMetadata().get("quantity");
        String transactionIdStr = session.getMetadata().get("transaction_id");

        Long memberId = Long.parseLong(memberIdStr);
        Long serviceId = Long.parseLong(serviceIdStr);
        Integer quantity = Integer.parseInt(quantityStr);
        Long transactionId = Long.parseLong(transactionIdStr);

        log.info("Metadata: member_id={}, service_id={}, quantity={}, transaction_id={}",
                memberId, serviceId, quantity, transactionId);

        // 4. Ažuriraj Transaction
        Transaction transaction = transactionRepository.findById(Math.toIntExact(transactionId))
                .orElseThrow(() -> {
                    log.error("Transakcija nije pronađena: {}", transactionId);
                    return new RuntimeException("Transakcija nije pronađena");
                });
        transaction.setStatus(Transaction.Status.SUCCESS);
        transaction.setPaymentDate(LocalDate.now());
        transaction.setPaymentMethod("card");
        transaction.setStripeCustomerId(session.getCustomer());
        transactionRepository.save(transaction);
        log.info("Transakcija {} ažurirana na SUCCESS", transaction.getId());

        // 5. Kreiraj Purchase
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> {
                    log.error("Član nije pronađen: {}", memberId);
                    return new RuntimeException("Član nije pronađen");
                });
        Service service = serviceRepository.findById(Math.toIntExact(serviceId))
                .orElseThrow(() -> {
                    log.error("Usluga nije pronađena: {}", serviceId);
                    return new RuntimeException("Usluga nije pronađena");
                });

        Purchase purchase = new Purchase();
        purchase.setMember(member);
        purchase.setService(service);
        purchase.setQuantity(quantity);
        purchase.setRemainingUses(quantity);
        purchase.setTotalPriceEur(service.getPriceEur().multiply(BigDecimal.valueOf(quantity)));
        purchase.setPurchaseDate(LocalDate.now());
        purchase.setExpiryDate(LocalDate.now().plusMonths(12)); // Važi 12 meseci
        purchase.setStatus(Purchase.Status.ACTIVE);
        purchase.setCreatedAt(LocalDateTime.now());

        // 6. Poveži Transaction sa Purchase
        transaction.setPurchase(purchase);
        purchaseRepository.save(purchase);
        transactionRepository.save(transaction);

        log.info("Purchase kreiran: id={} za člana {}", purchase.getId(), member.getFirstName());
    }
}