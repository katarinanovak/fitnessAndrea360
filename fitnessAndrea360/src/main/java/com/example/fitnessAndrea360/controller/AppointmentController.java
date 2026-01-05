package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.AppointmentRequestDTO;
import com.example.fitnessAndrea360.dto.AppointmentResponseDTO;
import com.example.fitnessAndrea360.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment Management", description = "API za upravljanje terminima")
@SecurityRequirement(name = "bearerAuth")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Zakazivanje termina",
            description = "Admin, zaposleni i članovi mogu zakazivati termine po određenim pravilima.")
    public ResponseEntity<AppointmentResponseDTO> createAppointment(@Valid @RequestBody AppointmentRequestDTO request) {
        AppointmentResponseDTO appointment = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(appointment);
    }

    // DODAJ OVE ENDPOINT-E:

    @GetMapping("/available")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Dohvati dostupne termine za člana",
            description = "Vraća sve termine koji su dostupni za rezervaciju")
    public ResponseEntity<List<AppointmentResponseDTO>> getAvailableAppointments() {
        List<AppointmentResponseDTO> appointments = appointmentService.getAvailableAppointments();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati nadolazeće termine",
            description = "Vraća termine koji će se održati u budućnosti")
    public ResponseEntity<List<AppointmentResponseDTO>> getUpcomingAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate) {

        LocalDate startDate = fromDate != null ? fromDate : LocalDate.now();
        List<AppointmentResponseDTO> appointments = appointmentService.getUpcomingAppointments(startDate);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Dohvati sve termine",
            description = "Vraća sve termine (samo za admina i zaposlene)")
    public ResponseEntity<List<AppointmentResponseDTO>> getAllAppointments() {
        List<AppointmentResponseDTO> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati termin po ID-u")
    public ResponseEntity<AppointmentResponseDTO> getAppointmentById(@PathVariable Long id) {
        AppointmentResponseDTO appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/service/{serviceId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Dohvati termine po servisu")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByService(@PathVariable Long serviceId) {
        List<AppointmentResponseDTO> appointments = appointmentService.getAppointmentsByService(serviceId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Dohvati termine po vremenskom periodu")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<AppointmentResponseDTO> appointments =
                appointmentService.getAppointmentsByDateRange(startDate, endDate);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Dohvati termine po lokaciji")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByLocation(@PathVariable Long locationId) {
        List<AppointmentResponseDTO> appointments = appointmentService.getAppointmentsByLocation(locationId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/member/current")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Dohvati termine trenutnog člana",
            description = "Vraća sve termine koje je trenutni član rezervisao")
    public ResponseEntity<List<AppointmentResponseDTO>> getCurrentMemberAppointments() {
        List<AppointmentResponseDTO> appointments = appointmentService.getCurrentMemberAppointments();
        return ResponseEntity.ok(appointments);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Ažuriraj termin")
    public ResponseEntity<AppointmentResponseDTO> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequestDTO request) {
        AppointmentResponseDTO appointment = appointmentService.updateAppointment(id, request);
        return ResponseEntity.ok(appointment);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Obriši termin")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/available/for-me")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAvailableAppointmentsForCurrentMember() {
        List<AppointmentResponseDTO> appointments = appointmentService.getAvailableAppointmentsForCurrentMember();
        return ResponseEntity.ok(appointments);
    }
}