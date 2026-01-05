package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // Pronađi sve rezervacije za određeni appointment
    List<Reservation> findByAppointmentId(Long appointmentId);

    // Pronađi sve rezervacije za određenog člana
    List<Reservation> findByMemberId(Long memberId);

    // Pronađi sve rezervacije za određenu lokaciju
    List<Reservation> findByAppointmentLocationId(Long locationId);

    // Pronađi sve rezervacije za određenu kupovinu
    List<Reservation> findByPurchaseId(Long purchaseId);

    // Pronađi rezervacije za lokaciju u određenom vremenskom periodu
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.location.id = :locationId AND " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime")
    List<Reservation> findByAppointmentLocationIdAndAppointmentStartTimeBetween(
            @Param("locationId") Long locationId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Provera da li već postoji rezervacija za appointment
    boolean existsByAppointmentId(Long appointmentId);

    // Provera da li član već ima rezervaciju za appointment
    boolean existsByMemberIdAndAppointmentId(Long memberId, Long appointmentId);

    // Broj aktivnih rezervacija za appointment (nije otkazano)
    @Query("SELECT COUNT(r) FROM Reservation r WHERE " +
            "r.appointment.id = :appointmentId AND " +
            "r.status NOT IN (com.example.fitnessAndrea360.model.Reservation.Status.CANCELLED, " +
            "com.example.fitnessAndrea360.model.Reservation.Status.NO_SHOW)")
    long countActiveReservationsByAppointmentId(@Param("appointmentId") Long appointmentId);

    // Rezervacije po statusu
    List<Reservation> findByStatus(Reservation.Status status);

    // Rezervacije po statusu kao String (za servis)
    @Query("SELECT r FROM Reservation r WHERE r.status = :status")
    List<Reservation> findByStatus(@Param("status") String status);

    // Rezervacije člana po statusu
    List<Reservation> findByMemberIdAndStatus(Long memberId, Reservation.Status status);

    // Rezervacije člana po statusu kao String (za servis)
    @Query("SELECT r FROM Reservation r WHERE r.member.id = :memberId AND r.status = :status")
    List<Reservation> findByMemberIdAndStatus(@Param("memberId") Long memberId, @Param("status") String status);

    // Današnje rezervacije za člana
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.member.id = :memberId AND " +
            "r.appointment.startTime BETWEEN :startOfDay AND :endOfDay")
    List<Reservation> findTodayReservationsByMemberId(
            @Param("memberId") Long memberId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    // Rezervacije koje ističu u narednih X dana
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.startTime BETWEEN :startDate AND :endDate AND " +
            "r.status = com.example.fitnessAndrea360.model.Reservation.Status.CONFIRMED")
    List<Reservation> findUpcomingReservations(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // NOVE METODE POTREBNE ZA SERVIS:

    // Rezervacije za appointment u određenom vremenskom periodu
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime")
    List<Reservation> findByAppointmentStartTimeBetween(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Rezervacije za lokaciju i vremenski period sa statusom
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.location.id = :locationId AND " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime AND " +
            "r.status = :status")
    List<Reservation> findByAppointmentStartTimeBetweenAndLocationIdAndStatus(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("locationId") Long locationId,
            @Param("status") String status);

    // Rezervacije za člana u određenom vremenskom periodu
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.member.id = :memberId AND " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime")
    List<Reservation> findByMemberIdAndAppointmentStartTimeBetween(
            @Param("memberId") Long memberId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Rezervacije po statusu i lokaciji (za zaposlene)
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.status = :status AND " +
            "r.appointment.location.id = :locationId")
    List<Reservation> findByStatusAndLocationId(
            @Param("status") String status,
            @Param("locationId") Long locationId);



    // Rezervacije za lokaciju u određenom vremenskom periodu (za zaposlene)
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.location.id = :locationId AND " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime")
    List<Reservation> findByAppointmentStartTimeBetweenAndLocationId(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("locationId") Long locationId);

    // Rezervacije po statusu i lokaciji (sa enum statusom)
    List<Reservation> findByStatusAndAppointmentLocationId(Reservation.Status status, Long locationId);

    // Statistika - broj rezervacija po statusu za člana
    @Query("SELECT COUNT(r) FROM Reservation r WHERE " +
            "r.member.id = :memberId AND " +
            "r.status = :status")
    long countByMemberIdAndStatus(@Param("memberId") Long memberId, @Param("status") String status);

    // Statistika - broj rezervacija po mesecu za lokaciju
    @Query("SELECT COUNT(r) FROM Reservation r WHERE " +
            "r.appointment.location.id = :locationId AND " +
            "YEAR(r.appointment.startTime) = :year AND " +
            "MONTH(r.appointment.startTime) = :month")
    long countByLocationIdAndYearAndMonth(
            @Param("locationId") Long locationId,
            @Param("year") int year,
            @Param("month") int month);

    // Rezervacije sa isteklim terminima (prošle, a još CONFIRMED)
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.startTime < :now AND " +
            "r.status = com.example.fitnessAndrea360.model.Reservation.Status.CONFIRMED")
    List<Reservation> findExpiredReservations(@Param("now") LocalDateTime now);

    // Provera da li član ima rezervaciju za određenu uslugu u određenom periodu
    @Query("SELECT COUNT(r) > 0 FROM Reservation r WHERE " +
            "r.member.id = :memberId AND " +
            "r.appointment.service.id = :serviceId AND " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime AND " +
            "r.status NOT IN (com.example.fitnessAndrea360.model.Reservation.Status.CANCELLED)")
    boolean hasReservationForServiceInPeriod(
            @Param("memberId") Long memberId,
            @Param("serviceId") Long serviceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}