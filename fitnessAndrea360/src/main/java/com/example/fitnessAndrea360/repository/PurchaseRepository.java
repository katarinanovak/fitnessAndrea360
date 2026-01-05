package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByMemberId(Long memberId);
    // OVO DODAJ:



    @Query("SELECT p FROM Purchase p WHERE p.member.id = :memberId AND p.service.id = :serviceId")
    List<Purchase> findByMemberIdAndServiceId(@Param("memberId") Long memberId,
                                              @Param("serviceId") Long serviceId);

    // Ako treba i po statusu:
    List<Purchase> findByMemberIdAndServiceIdAndStatus(Long memberId, Long serviceId, Purchase.Status status);

    // Za pronalaženje aktivnih purchase-a sa remainingUses > 0:
    List<Purchase> findByMemberIdAndServiceIdAndStatusAndRemainingUsesGreaterThan(
            Long memberId, Long serviceId, Purchase.Status status, Integer remainingUses);

    List<Purchase> findByMemberIdAndStatus(Long memberId, Purchase.Status status);
}
