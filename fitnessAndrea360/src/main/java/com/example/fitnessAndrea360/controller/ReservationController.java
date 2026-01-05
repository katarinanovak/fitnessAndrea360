package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.AppointmentCapacityDTO;
import com.example.fitnessAndrea360.dto.ReservationRequestDTO;
import com.example.fitnessAndrea360.dto.ReservationResponseDTO;
import com.example.fitnessAndrea360.model.Reservation;
import com.example.fitnessAndrea360.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservation Management", description = "API za upravljanje rezervacijama")
@SecurityRequirement(name = "bearerAuth")
public class ReservationController {

    private final ReservationService reservationService;

//    @PostMapping
//    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
//    @Operation(summary = "Kreiraj rezervaciju za termin",
//            description = "Kreiraj rezervaciju za postojeći termin")
//    public ResponseEntity<ReservationResponseDTO> createReservation(@Valid @RequestBody ReservationRequestDTO request) {
//        ReservationResponseDTO reservation = reservationService.createReservation(request);
//        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
//    }
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Kreiraj rezervaciju za termin",
            description = "Kreiraj rezervaciju za postojeći termin")
    public ResponseEntity<ReservationResponseDTO> createReservation(@Valid @RequestBody ReservationRequestDTO request) {
        // DODAJ OVU PROVERU:
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        // Ako je član, MORA da ima purchaseId
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"))) {
            if (request.getPurchaseId() == null) {
                throw new ValidationException("Član mora da izabere paket za rezervaciju");
            }
        }

        ReservationResponseDTO reservation = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati rezervaciju po ID-u")
    public ResponseEntity<ReservationResponseDTO> getReservationById(@PathVariable Long id) {
        ReservationResponseDTO reservation = reservationService.getReservationById(id);
        return ResponseEntity.ok(reservation);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati sve rezervacije",
            description = "Vraća različite rezultate zavisno od uloge korisnika")
    public ResponseEntity<List<ReservationResponseDTO>> getAllReservations() {
        List<ReservationResponseDTO> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati rezervacije za člana")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByMember(@PathVariable Long memberId) {
        List<ReservationResponseDTO> reservations = reservationService.getReservationsByMember(memberId);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati rezervacije za termin")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByAppointment(@PathVariable Long appointmentId) {
        List<ReservationResponseDTO> reservations = reservationService.getReservationsByAppointment(appointmentId);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati rezervacije po statusu")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByStatus(@PathVariable String status) {
        List<ReservationResponseDTO> reservations = reservationService.getReservationsByStatus(status);
        return ResponseEntity.ok(reservations);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Promeni status rezervacije",
            description = "Promeni status rezervacije (CONFIRMED, CANCELLED, ATTENDED, NO_SHOW)")
    public ResponseEntity<ReservationResponseDTO> updateReservationStatus(
            @PathVariable Long id,
            @RequestParam String status) { // IZMENJENO: Uklonjen notes parametar
        ReservationResponseDTO reservation = reservationService.updateReservationStatus(id, status);
        return ResponseEntity.ok(reservation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Ažuriraj rezervaciju")
    public ResponseEntity<ReservationResponseDTO> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequestDTO request) {
        ReservationResponseDTO reservation = reservationService.updateReservation(id, request);
        return ResponseEntity.ok(reservation);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Obriši rezervaciju")
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/appointment/{appointmentId}/capacity")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Prikaz kapaciteta termina")
    public ResponseEntity<AppointmentCapacityDTO> getAppointmentCapacity(@PathVariable Long appointmentId) {
        AppointmentCapacityDTO capacity = reservationService.getAppointmentCapacity(appointmentId);
        return ResponseEntity.ok(capacity);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati rezervacije po vremenskom periodu")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ReservationResponseDTO> reservations =
                reservationService.getReservationsByDateRange(startDate, endDate);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Prikaz svih rezervacija za lokaciju")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByLocation(
            @PathVariable Long locationId) {
        List<ReservationResponseDTO> reservations = reservationService.getReservationsByLocation(locationId);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/location/{locationId}/today")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Prikaz današnjih rezervacija za lokaciju")
    public ResponseEntity<List<ReservationResponseDTO>> getTodayReservationsByLocation(
            @PathVariable Long locationId) {
        List<ReservationResponseDTO> reservations = reservationService.getTodayReservationsByLocation(locationId);
        return ResponseEntity.ok(reservations);
    }


    @GetMapping("/check/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Proveri da li postoji rezervacija za termin")
    public ResponseEntity<Boolean> checkReservationExists(@PathVariable Long appointmentId) {
        boolean exists = reservationService.checkReservationExists(appointmentId);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/member/current")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Dohvati rezervacije trenutnog člana")
    public ResponseEntity<List<ReservationResponseDTO>> getCurrentMemberReservations() {
        List<ReservationResponseDTO> reservations = reservationService.getCurrentMemberReservations();
        return ResponseEntity.ok(reservations);
    }
}