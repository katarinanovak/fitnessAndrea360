package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.AppointmentCapacityDTO;
import com.example.fitnessAndrea360.service.ReservationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/capacity")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class CapacityController {

    private final ReservationService reservationService;

    @GetMapping("/appointment/{appointmentId}")
    public AppointmentCapacityDTO getAppointmentCapacity(@PathVariable Long appointmentId) {
        return reservationService.getAppointmentCapacity(appointmentId);
    }

    @GetMapping("/location/{locationId}")
    public List<AppointmentCapacityDTO> getLocationAppointmentsCapacity(@PathVariable Long locationId) {
        return reservationService.getLocationAppointmentsCapacity(locationId);
    }

    // WebSocket endpoint za real-time updates
    @MessageMapping("/capacity.update")
    @SendTo("/topic/capacity")
    public AppointmentCapacityDTO sendCapacityUpdate(@RequestBody Long appointmentId) {
        return reservationService.getAppointmentCapacity(appointmentId);
    }
}