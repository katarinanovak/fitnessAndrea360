package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByLocationId(Long locationId);

    List<Appointment> findByMemberId(Long memberId);

    List<Appointment> findByServiceId(Long serviceId);

    List<Appointment> findByCreatedById(Long userId);

    List<Appointment> findByLocationIdAndStartTimeBetween(
            Long locationId,
            LocalDateTime startTime,
            LocalDateTime endTime);

    // Provera da li član već ima termin u određenom vremenskom periodu
    boolean existsByMemberIdAndStartTimeBetween(
            Long memberId,
            LocalDateTime startTime,
            LocalDateTime endTime);

    // Provera zauzetosti lokacije za grupne treninge
    @Query("SELECT COUNT(a) FROM Appointment a WHERE " +
            "a.location.id = :locationId AND " +
            "a.status NOT IN ('CANCELLED') AND " +
            "((a.startTime < :endTime AND a.endTime > :startTime))")
    long countByLocationIdAndTimeOverlap(
            @Param("locationId") Long locationId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);



    // Pronađi termine koji počinju nakon određenog vremena i imaju određeni status
    List<Appointment> findByStartTimeAfterAndStatus(LocalDateTime startTime, String status);

    // Pronađi termine po vremenskom periodu
    List<Appointment> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    // Pronađi dostupne termine (ima slobodnih mesta, nisu prošli, nisu otkazani)
    @Query("SELECT a FROM Appointment a WHERE " +
            "a.startTime > :now AND " +
            "a.currentCapacity < a.maxCapacity AND " +
            "a.status = 'SCHEDULED'")
    List<Appointment> findAvailableAppointments(@Param("now") LocalDateTime now);
}