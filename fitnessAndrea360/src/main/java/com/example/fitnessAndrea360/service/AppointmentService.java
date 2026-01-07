package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.AppointmentRequestDTO;
import com.example.fitnessAndrea360.dto.AppointmentResponseDTO;
import com.example.fitnessAndrea360.dto.CapacityStatusDTO;
import com.example.fitnessAndrea360.exception.*;
import com.example.fitnessAndrea360.model.*;
import com.example.fitnessAndrea360.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceRepository serviceRepository;
    private final MemberRepository memberRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final MemberService memberService;
    private final PurchaseRepository purchaseRepository;
    private final ReservationRepository reservationRepository;


    private User getCurrentUserWithLocation() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        // Učitaj korisnika SA lokacijom iz baze
        return userRepository.findByEmailWithLocation(email)
                .orElseThrow(() -> new RuntimeException("Trenutni korisnik nije pronađen u bazi"));
    }
    /**
     * Vrati sve dostupne termine za TRENUTNOG člana
     * (samo one koje može da rezerviše - ima kupljenu uslugu)
     */
    public List<AppointmentResponseDTO> getAvailableAppointmentsForCurrentMember() {
        User currentUser = getCurrentUserWithLocation();


        Member member = memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        LocalDateTime now = LocalDateTime.now();


        List<Appointment> allAppointments = appointmentRepository.findByStartTimeAfterAndStatus(now, "SCHEDULED");


        List<Purchase> memberPurchases = purchaseRepository.findByMemberId(member.getId());



        // Filtriraj samo one koje ovaj član MOŽE da rezerviše:
        // 1. Ima slobodno mesto
        // 2. Ima kupljenu uslugu sa remainingUses > 0
        return allAppointments.stream()
                .filter(appointment -> {
                    // Provera 1: Ima li slobodno mesto?
                    boolean hasCapacity = appointment.getMaxCapacity() > appointment.getCurrentCapacity();

                    if (!hasCapacity) return false;

                    // Provera 2: Ima li kupljenu uslugu? - KORISTI PurchaseRepository!
                    boolean hasPurchase = memberPurchases.stream()
                            .anyMatch(purchase ->
                                    purchase.getService().getId().equals(appointment.getService().getId()) &&
                                            purchase.getRemainingUses() > 0 &&
                                            purchase.getStatus().equals("ACTIVE")
                            );

                    System.out.println("Appointment: " + appointment.getService().getName() +
                            " - Has capacity: " + hasCapacity +
                            " - Has purchase: " + hasPurchase);

                    return hasPurchase;
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO request) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        Long targetLocationId;


        if (userRole.equals("EMPLOYEE")) {
            // Zaposleni MORA koristiti svoju lokaciju iz baze
            if (currentUser.getLocation() == null) {
                throw new UnauthorizedAccessException("Zaposleni nema dodeljenu lokaciju");
            }
            targetLocationId = currentUser.getLocation().getId();
            System.out.println("Employee using their location from database: " + targetLocationId);


            System.out.println("Ignoring requested locationId: " + request.getLocationId());

        } else if (userRole.equals("ADMIN")) {
            // Admin može da bira lokaciju
            targetLocationId = request.getLocationId();
            if (targetLocationId == null) {
                throw new ValidationException("Admin mora specificirati locationId");
            }

        } else if (userRole.equals("MEMBER")) {
            // Član može samo svoju lokaciju
            Member member = memberRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
            targetLocationId = member.getLocation().getId();

        } else {
            throw new UnauthorizedAccessException("Nemaš pravo da kreiraš termine");
        }


        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ValidationException("Termin mora biti u budućnosti");
        }


        validateAppointmentAccess(currentUser, request, targetLocationId);


        com.example.fitnessAndrea360.model.Service service = serviceRepository.findById(Math.toIntExact(request.getServiceId()))
                .orElseThrow(() -> new ResourceNotFoundException("Usluga nije pronađena"));

        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        Location location = locationRepository.findById(targetLocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lokacija nije pronađena"));


        validateAppointment(service, member, location, request.getStartTime());

        // 5. Provera zauzetosti - da li član već ima termin u to vreme
        if (appointmentRepository.existsByMemberIdAndStartTimeBetween(
                member.getId(),
                request.getStartTime().minusMinutes(30),
                request.getStartTime().plusMinutes(service.getDurationMinutes() + 30))) {
            throw new ValidationException("Član već ima termin u ovom vremenskom periodu");
        }

        // 6. Provera da li je lokacija slobodna (za grupne treninge)
        if (service.getMaxCapacity() > 1) {
            long conflictingAppointments = appointmentRepository.countByLocationIdAndTimeOverlap(
                    location.getId(),
                    request.getStartTime(),
                    request.getStartTime().plusMinutes(service.getDurationMinutes()));

            if (conflictingAppointments > 0) {
                throw new ValidationException("Lokacija je zauzeta u ovom terminu");
            }
        }


        Appointment appointment = new Appointment();
        appointment.setService(service);
        appointment.setMember(member);
        appointment.setLocation(location);
        appointment.setCreatedBy(currentUser);
        appointment.setStartTime(request.getStartTime());
        appointment.setMaxCapacity(service.getMaxCapacity());
        appointment.setCurrentCapacity(0);
        appointment.setEndTime(request.getStartTime().plusMinutes(service.getDurationMinutes()));
        appointment.setStatus("SCHEDULED");
        appointment.setNotes(request.getNotes());

        Appointment savedAppointment = appointmentRepository.save(appointment);

        return mapToResponse(savedAppointment);
    }

    private void validateAppointmentAccess(User user, AppointmentRequestDTO request, Long targetLocationId) {
        String userRole = user.getRole().getName();

        if (userRole.equals("ADMIN")) {
            return;
        }

        if (userRole.equals("EMPLOYEE")) {
            // Zaposleni može zakazati termin SAMO na svojoj lokaciji
            Long employeeLocationId = user.getLocation().getId();

            if (!employeeLocationId.equals(targetLocationId)) {
                throw new UnauthorizedAccessException(
                        "Zaposleni može zakazati termine samo za svoju lokaciju (ID: " + employeeLocationId + ")"
                );
            }
            return;
        }

        if (userRole.equals("MEMBER")) {
            // Član može zakazati termin SAMO sebi
            Member member = memberRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

            if (!member.getId().equals(request.getMemberId())) {
                throw new UnauthorizedAccessException("Član može zakazati termine samo sebi");
            }
            return;
        }

        throw new UnauthorizedAccessException("Nemaš pravo pristupa");
    }

    private void validateAppointment(com.example.fitnessAndrea360.model.Service service, Member member, Location location, LocalDateTime startTime) {

        boolean isServiceAvailableAtLocation = service.getLocations().stream()
                .anyMatch(loc -> loc.getId().equals(location.getId()));

        if (!isServiceAvailableAtLocation) {
            throw new ValidationException("Usluga '" + service.getName() + "' nije dostupna na lokaciji '" + location.getName() + "'");
        }


        if (!member.getMembershipStatus().equals(Member.MembershipStatus.ACTIVE)) {
            throw new ValidationException("Član nema aktivan status članstva");
        }


        if (!member.getLocation().getId().equals(location.getId())) {
            throw new ValidationException("Član nije član ove lokacije");
        }


        int hour = startTime.getHour();
        if (hour < 8 || hour > 22) {
            throw new ValidationException("Termini su dostupni samo između 8:00 i 22:00");
        }


        if (startTime.isBefore(LocalDateTime.now().plusHours(2))) {
            throw new ValidationException("Termin mora biti zakazan najmanje 2 sata unapred");
        }
    }



    /**
     * Vrati sve dostupne termine za člana
     */
    public List<AppointmentResponseDTO> getAvailableAppointments() {
        LocalDateTime now = LocalDateTime.now();

        List<Appointment> appointments = appointmentRepository.findByStartTimeAfterAndStatus(now, "SCHEDULED");

        // Filtriraj samo one koji imaju slobodnih mesta (maxCapacity > currentCapacity)
        return appointments.stream()
                .filter(appointment -> appointment.getMaxCapacity() > appointment.getCurrentCapacity())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Vrati nadolazeće termine od određenog datuma
     */
    public List<AppointmentResponseDTO> getUpcomingAppointments(LocalDate fromDate) {
        LocalDateTime startDateTime = fromDate.atStartOfDay();

        List<Appointment> appointments = appointmentRepository.findByStartTimeAfterAndStatus(startDateTime, "SCHEDULED");

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Vrati sve termine (samo za admina/zaposlene)
     */
    public List<AppointmentResponseDTO> getAllAppointments() {
        List<Appointment> appointments = appointmentRepository.findAll();

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Vrati termin po ID-u
     */
    public AppointmentResponseDTO getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        return mapToResponse(appointment);
    }

    /**
     * Vrati termine po servisu
     */
    public List<AppointmentResponseDTO> getAppointmentsByService(Long serviceId) {
        List<Appointment> appointments = appointmentRepository.findByServiceId(serviceId);

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Vrati termine po vremenskom periodu
     */
    public List<AppointmentResponseDTO> getAppointmentsByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Koristimo postojeću metodu iz repository-a
        List<Appointment> appointments = appointmentRepository.findByStartTimeBetween(startDateTime, endDateTime);

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Vrati termine po lokaciji
     */
    public List<AppointmentResponseDTO> getAppointmentsByLocation(Long locationId) {
        User currentUser = getCurrentUserWithLocation();
        validateLocationAccess(currentUser, locationId);

        List<Appointment> appointments = appointmentRepository.findByLocationId(locationId);

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Vrati termine trenutnog člana
     */
    public List<AppointmentResponseDTO> getCurrentMemberAppointments() {
        User currentUser = getCurrentUserWithLocation();

        // Pronađi member-a za ovog user-a
        Member member = memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        // Dobavi sve appointment-e za ovog member-a
        List<Appointment> appointments = appointmentRepository.findByMemberId(member.getId());

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Ažuriraj termin
     */
    @Transactional
    public AppointmentResponseDTO updateAppointment(Long id, AppointmentRequestDTO request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        User currentUser = getCurrentUserWithLocation();
        validateAppointmentModificationAccess(currentUser, appointment);

        // Ažuriraj polja
        com.example.fitnessAndrea360.model.Service service = serviceRepository.findById(Math.toIntExact(request.getServiceId()))
                .orElseThrow(() -> new ResourceNotFoundException("Usluga nije pronađena"));

        appointment.setService(service);
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getStartTime().plusMinutes(service.getDurationMinutes()));
        appointment.setNotes(request.getNotes());

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        return mapToResponse(updatedAppointment);
    }

    /**
     * Obriši termin
     */
    @Transactional
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        User currentUser = getCurrentUserWithLocation();
        validateAppointmentModificationAccess(currentUser, appointment);

        // Proveri da li ima rezervacija (currentCapacity)
        if (appointment.getCurrentCapacity() > 0) {
            throw new RuntimeException("Ne možete obrisati termin koji ima rezervacije");
        }

        appointmentRepository.delete(appointment);
    }



    public List<AppointmentResponseDTO> getTodayAppointmentsByLocation(Long locationId) {
        User currentUser = getCurrentUserWithLocation();
        validateLocationAccess(currentUser, locationId);

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);

        List<Appointment> appointments = appointmentRepository.findByLocationIdAndStartTimeBetween(locationId, startOfDay, endOfDay);

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponseDTO cancelAppointment(Long appointmentId, String cancellationReason) {
        User currentUser = getCurrentUserWithLocation();

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        validateAppointmentModificationAccess(currentUser, appointment);

        if (appointment.getStartTime().isBefore(LocalDateTime.now().plusHours(1))) {
            throw new ValidationException("Termin se može otkazati najmanje 1 sat pre početka");
        }

        appointment.setStatus("CANCELLED");
        appointment.setNotes((appointment.getNotes() != null ? appointment.getNotes() + "\n" : "") +
                "Otkazano: " + cancellationReason);

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        return mapToResponse(updatedAppointment);
    }

    @Transactional
    public AppointmentResponseDTO confirmAppointmentAttendance(Long appointmentId) {
        User currentUser = getCurrentUserWithLocation();

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        validateLocationAccess(currentUser, appointment.getLocation().getId());

        if (!appointment.getStatus().equals("SCHEDULED")) {
            throw new ValidationException("Samo zakazani termini mogu biti potvrđeni");
        }

        appointment.setStatus("CONFIRMED");
        Appointment updatedAppointment = appointmentRepository.save(appointment);

        return mapToResponse(updatedAppointment);
    }

    @Transactional
    public AppointmentResponseDTO completeAppointment(Long appointmentId) {
        User currentUser = getCurrentUserWithLocation();

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        validateLocationAccess(currentUser, appointment.getLocation().getId());

        if (!appointment.getStatus().equals("CONFIRMED") && !appointment.getStatus().equals("IN_PROGRESS")) {
            throw new ValidationException("Samo potvrđeni termini mogu biti završeni");
        }

        appointment.setStatus("COMPLETED");
        Appointment updatedAppointment = appointmentRepository.save(appointment);

        return mapToResponse(updatedAppointment);
    }



    public CapacityStatusDTO getLocationCapacityStatus(Long locationId, LocalDate date) {
        User currentUser = getCurrentUserWithLocation();
        validateLocationAccess(currentUser, locationId);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Appointment> appointments = appointmentRepository.findByLocationIdAndStartTimeBetween(locationId, startOfDay, endOfDay);

        Map<Integer, Long> appointmentsPerHour = new HashMap<>();
        for (int hour = 8; hour <= 22; hour++) {
            final int currentHour = hour;
            long count = appointments.stream()
                    .filter(a -> a.getStartTime().getHour() == currentHour)
                    .count();
            appointmentsPerHour.put(hour, count);
        }

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lokacija nije pronađena"));

        return CapacityStatusDTO.builder()
                .locationId(locationId)
                .locationName(location.getName())
                .date(date)
                .appointmentsPerHour(appointmentsPerHour)
                .totalAppointments(appointments.size())
                .averageUtilization(calculateAverageUtilization(appointmentsPerHour))
                .build();
    }

    // ========== POMOĆNE METODE ==========

    private void validateLocationAccess(User user, Long locationId) {
        String userRole = user.getRole().getName();

        if (userRole.equals("ADMIN")) {
            return;
        }

        if (userRole.equals("EMPLOYEE")) {
            Long employeeLocationId = user.getLocation().getId();
            if (!employeeLocationId.equals(locationId)) {
                throw new UnauthorizedAccessException(
                        "Možete pristupiti samo podacima za svoju lokaciju (ID: " + employeeLocationId + ")"
                );
            }
            return;
        }

        if (userRole.equals("MEMBER")) {
            Member member = memberRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
            if (!member.getLocation().getId().equals(locationId)) {
                throw new UnauthorizedAccessException("Možete pristupiti samo podacima svoje lokacije");
            }
            return;
        }

        throw new UnauthorizedAccessException("Nemaš pravo pristupa");
    }

    private void validateAppointmentModificationAccess(User user, Appointment appointment) {
        String userRole = user.getRole().getName();

        if (userRole.equals("ADMIN")) {
            return;
        }

        if (userRole.equals("EMPLOYEE")) {
            Long employeeLocationId = user.getLocation().getId();
            if (!employeeLocationId.equals(appointment.getLocation().getId())) {
                throw new UnauthorizedAccessException(
                        "Možete upravljati samo terminima na svojoj lokaciji (ID: " + employeeLocationId + ")"
                );
            }
            return;
        }

        if (userRole.equals("MEMBER")) {
            Member member = memberRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

            if (!member.getId().equals(appointment.getMember().getId())) {
                throw new UnauthorizedAccessException("Možete upravljati samo svojim terminima");
            }
            return;
        }

        throw new UnauthorizedAccessException("Nemaš pravo pristupa");
    }

    private double calculateAverageUtilization(Map<Integer, Long> appointmentsPerHour) {
        if (appointmentsPerHour.isEmpty()) return 0;
        long total = appointmentsPerHour.values().stream().mapToLong(Long::longValue).sum();
        return (double) total / appointmentsPerHour.size();
    }

//    private AppointmentResponseDTO mapToResponse(Appointment appointment) {
//        return AppointmentResponseDTO.builder()
//                .id(appointment.getId())
//                .serviceId(appointment.getService().getId())
//                .serviceName(appointment.getService().getName())
//                .servicePrice(appointment.getService().getPriceEur())
//                .memberId(appointment.getMember().getId())
//                .memberName(appointment.getMember().getFirstName() + " " + appointment.getMember().getLastName())
//                .memberEmail(appointment.getMember().getEmail())
//                .locationId(appointment.getLocation().getId())
//                .locationName(appointment.getLocation().getName())
//                .createdById(appointment.getCreatedBy() != null ? appointment.getCreatedBy().getId() : null)
//                .createdByName(appointment.getCreatedBy() != null ?
//                        appointment.getCreatedBy().getFirstName() + " " + appointment.getCreatedBy().getLastName() : null)
//                .startTime(appointment.getStartTime())
//                .endTime(appointment.getEndTime())
//                .status(appointment.getStatus())
//                .notes(appointment.getNotes())
//                .createdAt(appointment.getCreatedAt())
//                .updatedAt(appointment.getUpdatedAt())
//                .build();
//    }
private AppointmentResponseDTO mapToResponse(Appointment appointment) {
    return AppointmentResponseDTO.builder()
            .id(appointment.getId())
            .serviceId(appointment.getService().getId())
            .serviceName(appointment.getService().getName())
            .servicePrice(appointment.getService().getPriceEur())
            .durationMinutes(appointment.getService().getDurationMinutes())
            .maxCapacity(appointment.getService().getMaxCapacity())
            .currentCapacity(appointment.getCurrentCapacity())
            .memberId(appointment.getMember().getId())
            .memberName(appointment.getMember().getFirstName() + " " + appointment.getMember().getLastName())
            .memberEmail(appointment.getMember().getEmail())
            .locationId(appointment.getLocation().getId())
            .locationName(appointment.getLocation().getName())
            .createdById(appointment.getCreatedBy() != null ? appointment.getCreatedBy().getId() : null)
            .createdByName(appointment.getCreatedBy() != null ?
                    appointment.getCreatedBy().getFirstName() + " " + appointment.getCreatedBy().getLastName() : null)
            .startTime(appointment.getStartTime())
            .endTime(appointment.getEndTime())
            .status(appointment.getStatus())
            .notes(appointment.getNotes())
            .createdAt(appointment.getCreatedAt())
            .updatedAt(appointment.getUpdatedAt())
            .build();
}
}