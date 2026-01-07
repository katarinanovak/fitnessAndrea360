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


    List<Reservation> findByAppointmentId(Long appointmentId);


    List<Reservation> findByMemberId(Long memberId);


    List<Reservation> findByAppointmentLocationId(Long locationId);


    List<Reservation> findByPurchaseId(Long purchaseId);

    // Pronađi rezervacije za lokaciju u određenom vremenskom periodu
    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.location.id = :locationId AND " +
            "r.appointment.startTime BETWEEN :startTime AND :endTime")
    List<Reservation> findByAppointmentLocationIdAndAppointmentStartTimeBetween(
            @Param("locationId") Long locationId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);


    boolean existsByAppointmentId(Long appointmentId);


    boolean existsByMemberIdAndAppointmentId(Long memberId, Long appointmentId);


    @Query("SELECT COUNT(r) FROM Reservation r WHERE " +
            "r.appointment.id = :appointmentId AND " +
            "r.status NOT IN (com.example.fitnessAndrea360.model.Reservation.Status.CANCELLED, " +
            "com.example.fitnessAndrea360.model.Reservation.Status.NO_SHOW)")
    long countActiveReservationsByAppointmentId(@Param("appointmentId") Long appointmentId);


    List<Reservation> findByStatus(Reservation.Status status);


    @Query("SELECT r FROM Reservation r WHERE r.status = :status")
    List<Reservation> findByStatus(@Param("status") String status);


    List<Reservation> findByMemberIdAndStatus(Long memberId, Reservation.Status status);


    @Query("SELECT r FROM Reservation r WHERE r.member.id = :memberId AND r.status = :status")
    List<Reservation> findByMemberIdAndStatus(@Param("memberId") Long memberId, @Param("status") String status);


    @Query("SELECT r FROM Reservation r WHERE " +
            "r.member.id = :memberId AND " +
            "r.appointment.startTime BETWEEN :startOfDay AND :endOfDay")
    List<Reservation> findTodayReservationsByMemberId(
            @Param("memberId") Long memberId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT r FROM Reservation r WHERE " +
            "r.appointment.startTime BETWEEN :startDate AND :endDate AND " +
            "r.status = com.example.fitnessAndrea360.model.Reservation.Status.CONFIRMED")
    List<Reservation> findUpcomingReservations(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);



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