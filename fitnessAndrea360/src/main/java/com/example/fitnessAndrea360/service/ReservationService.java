package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.AppointmentCapacityDTO;
import com.example.fitnessAndrea360.dto.ReservationRequestDTO;
import com.example.fitnessAndrea360.dto.ReservationResponseDTO;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final AppointmentRepository appointmentRepository;
    private final MemberRepository memberRepository;
    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Trenutni korisnik nije pronađen"));
    }

    private User getCurrentUserWithLocation() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmailWithLocation(email)
                .orElseThrow(() -> new RuntimeException("Trenutni korisnik nije pronađen"));
    }

    private Long getLocationIdFromToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Pokušaj da dobiješ locationId iz authentication details
        if (authentication.getDetails() instanceof Map) {
            Map<?, ?> details = (Map<?, ?>) authentication.getDetails();
            Object locationIdObj = details.get("locationId");
            if (locationIdObj instanceof Long) {
                return (Long) locationIdObj;
            } else if (locationIdObj instanceof Integer) {
                return ((Integer) locationIdObj).longValue();
            }
        }

        // Fallback: ako nema u tokenu, koristi iz baze
        User user = getCurrentUserWithLocation();
        if (user.getLocation() != null) {
            return user.getLocation().getId();
        }

        throw new UnauthorizedAccessException("Nema dodeljene lokacije");
    }
    @Transactional
    public ReservationResponseDTO createReservation(ReservationRequestDTO request) {
        User currentUser = getCurrentUserWithLocation();

        // 1. Dobijanje entiteta
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        // 2. Pronađi trenutnog člana (onaj koji je ulogovan)
        Member currentMember = memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        Purchase purchase = purchaseRepository.findById(request.getPurchaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Kupovina nije pronađena"));

        // 3. Provera da li kupovina pripada TRENUTNOM članu
        if (!purchase.getMember().getId().equals(currentMember.getId())) {
            throw new UnauthorizedAccessException("Kupovina ne pripada trenutnom članu");
        }

        // 4. Validacija rezervacije sa TRENUTNIM članom
        validateReservation(appointment, currentMember, purchase);

        // 5. Kreiranje rezervacije sa TRENUTNIM članom
        Reservation reservation = new Reservation();
        reservation.setAppointment(appointment);
        reservation.setMember(currentMember); //  koristi currentMember, ne appointment.getMember()
        reservation.setPurchase(purchase);
        reservation.setStatus(Reservation.Status.CONFIRMED);
        reservation.setNotes(request.getNotes());

        // 6. Smanji remainingUses u purchase
        purchase.setRemainingUses(purchase.getRemainingUses() - 1);
        purchaseRepository.save(purchase);

        // 7. Povećaj currentCapacity u appointment
        appointment.setCurrentCapacity(appointment.getCurrentCapacity() + 1);
        appointmentRepository.save(appointment);

        Reservation savedReservation = reservationRepository.save(reservation);

        return mapToResponse(savedReservation);
    }



    @Transactional(readOnly = true)
    public AppointmentCapacityDTO getAppointmentCapacity(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        return AppointmentCapacityDTO.builder()
                .appointmentId(appointmentId)
                .maxCapacity(appointment.getMaxCapacity())
                .currentCapacity(appointment.getCurrentCapacity())
                .availableSpaces(appointment.getMaxCapacity() - appointment.getCurrentCapacity())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AppointmentCapacityDTO> getLocationAppointmentsCapacity(Long locationId) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        // Provera prava pristupa za zaposlene
        if (userRole.equals("EMPLOYEE")) {
            Long employeeLocationId = getLocationIdFromToken();
            if (!employeeLocationId.equals(locationId)) {
                throw new UnauthorizedAccessException("Možete videti samo kapacitete svoje lokacije");
            }
        } else if (!userRole.equals("ADMIN")) {
            throw new UnauthorizedAccessException("Samo admin i zaposleni mogu videti kapacitete lokacije");
        }

        List<Appointment> appointments = appointmentRepository.findByLocationId(locationId);

        return appointments.stream()
                .map(appointment -> AppointmentCapacityDTO.builder()
                        .appointmentId(appointment.getId())
                        .startTime(appointment.getStartTime())
                        .endTime(appointment.getEndTime())
                        .serviceName(appointment.getService().getName())
                        .maxCapacity(appointment.getMaxCapacity())
                        .currentCapacity(appointment.getCurrentCapacity())
                        .availableSpaces(appointment.getMaxCapacity() - appointment.getCurrentCapacity())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReservationResponseDTO getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rezervacija nije pronađena"));

        // Provera prava pristupa
        validateReservationAccess(getCurrentUserWithLocation(), reservation.getAppointment());

        return mapToResponse(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getAllReservations() {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        List<Reservation> reservations;

        if (userRole.equals("ADMIN")) {
            reservations = reservationRepository.findAll();
        } else if (userRole.equals("EMPLOYEE")) {
            Long locationId = getLocationIdFromToken();
            reservations = reservationRepository.findByAppointmentLocationId(locationId);
        } else if (userRole.equals("MEMBER")) {
            Member member = memberRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
            reservations = reservationRepository.findByMemberId(member.getId());
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo pristupa");
        }

        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getReservationsByMember(Long memberId) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        // Provera prava pristupa
        if (userRole.equals("MEMBER")) {
            Member currentMember = memberRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
            if (!currentMember.getId().equals(memberId)) {
                throw new UnauthorizedAccessException("Možete videti samo svoje rezervacije");
            }
        }

        List<Reservation> reservations = reservationRepository.findByMemberId(memberId);
        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getReservationsByAppointment(Long appointmentId) {
        User currentUser = getCurrentUserWithLocation();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Termin nije pronađen"));

        // Provera prava pristupa
        validateReservationAccess(currentUser, appointment);

        List<Reservation> reservations = reservationRepository.findByAppointmentId(appointmentId);
        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getReservationsByStatus(String status) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        List<Reservation> reservations;

        if (userRole.equals("ADMIN")) {
            reservations = reservationRepository.findByStatus(status);
        } else if (userRole.equals("EMPLOYEE")) {
            Long locationId = getLocationIdFromToken();
            reservations = reservationRepository.findByStatusAndLocationId(status, locationId);
        } else if (userRole.equals("MEMBER")) {
            Member member = memberRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
            reservations = reservationRepository.findByMemberIdAndStatus(member.getId(), status);
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo pristupa");
        }

        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReservationResponseDTO updateReservation(Long id, ReservationRequestDTO request) {
        User currentUser = getCurrentUserWithLocation();

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rezervacija nije pronađena"));

        // Provera prava pristupa
        validateReservationAccess(currentUser, reservation.getAppointment());

        // Ako se menja purchase, proveri novi purchase
        if (!reservation.getPurchase().getId().equals(request.getPurchaseId())) {
            Purchase newPurchase = purchaseRepository.findById(request.getPurchaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Kupovina nije pronađena"));

            // Vrati prethodni remainingUses
            Purchase oldPurchase = reservation.getPurchase();
            oldPurchase.setRemainingUses(oldPurchase.getRemainingUses() + 1);
            purchaseRepository.save(oldPurchase);

            // Validacija novog purchase-a
            validatePurchaseForReservation(newPurchase, reservation.getAppointment(), reservation.getMember());

            // Postavi novi purchase i smanji remainingUses
            reservation.setPurchase(newPurchase);
            newPurchase.setRemainingUses(newPurchase.getRemainingUses() - 1);
            purchaseRepository.save(newPurchase);
        }

        reservation.setNotes(request.getNotes());
        Reservation updatedReservation = reservationRepository.save(reservation);

        return mapToResponse(updatedReservation);
    }

    @Transactional
    public ReservationResponseDTO updateReservationStatus(Long id, String status) {
        User currentUser = getCurrentUserWithLocation();

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rezervacija nije pronađena"));

        // Provera prava pristupa
        validateReservationAccess(currentUser, reservation.getAppointment());

        // Validacija statusa
        try {
            Reservation.Status newStatus = Reservation.Status.valueOf(status.toUpperCase());
            reservation.setStatus(newStatus);

            // Ako se otkazuje rezervacija, vrati remainingUses
            if (newStatus == Reservation.Status.CANCELLED) {
                Purchase purchase = reservation.getPurchase();
                purchase.setRemainingUses(purchase.getRemainingUses() + 1);
                purchaseRepository.save(purchase);
                // Smanji currentCapacity u appointment
                Appointment appointment = reservation.getAppointment();
                appointment.setCurrentCapacity(appointment.getCurrentCapacity() - 1);
                appointmentRepository.save(appointment);
            }

            // Ako se označava kao prisutan ili no-show, ne menjaj kapacitet
            if (newStatus == Reservation.Status.ATTENDED || newStatus == Reservation.Status.NO_SHOW) {
                // Samo promeni status, kapacitet ostaje isti
            }

            Reservation updatedReservation = reservationRepository.save(reservation);
            return mapToResponse(updatedReservation);
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Nevalidan status: " + status);
        }
    }

    @Transactional
    public void deleteReservation(Long id) {
        User currentUser = getCurrentUserWithLocation();

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rezervacija nije pronađena"));

        // Provera prava pristupa
        validateReservationAccess(currentUser, reservation.getAppointment());

        // Smanji currentCapacity u appointment
        Appointment appointment = reservation.getAppointment();
        appointment.setCurrentCapacity(appointment.getCurrentCapacity() - 1);
        appointmentRepository.save(appointment);

        // Vrati remainingUses
        Purchase purchase = reservation.getPurchase();
        purchase.setRemainingUses(purchase.getRemainingUses() + 1);
        purchaseRepository.save(purchase);

        reservationRepository.delete(reservation);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getReservationsByDateRange(LocalDate startDate, LocalDate endDate) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<Reservation> reservations;

        if (userRole.equals("ADMIN")) {
            reservations = reservationRepository.findByAppointmentStartTimeBetween(startDateTime, endDateTime);
        } else if (userRole.equals("EMPLOYEE")) {
            Long locationId = getLocationIdFromToken();
            reservations = reservationRepository.findByAppointmentStartTimeBetweenAndLocationId(
                    startDateTime, endDateTime, locationId);
        } else if (userRole.equals("MEMBER")) {
            Member member = memberRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
            reservations = reservationRepository.findByMemberIdAndAppointmentStartTimeBetween(
                    member.getId(), startDateTime, endDateTime);
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo pristupa");
        }

        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getReservationsByLocation(Long locationId) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        // Provera prava pristupa
        if (!userRole.equals("ADMIN") && !userRole.equals("EMPLOYEE")) {
            throw new UnauthorizedAccessException("Samo admin i zaposleni mogu videti rezervacije po lokaciji");
        }

        // Provera da li zaposleni pristupa svojoj lokaciji
        if (userRole.equals("EMPLOYEE")) {
            Long employeeLocationId = getLocationIdFromToken();
            if (!employeeLocationId.equals(locationId)) {
                throw new UnauthorizedAccessException("Možete videti samo rezervacije na svojoj lokaciji");
            }
        }

        List<Reservation> reservations = reservationRepository.findByAppointmentLocationId(locationId);
        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getTodayReservationsByLocation(Long locationId) {
        User currentUser = getCurrentUserWithLocation();
        String userRole = currentUser.getRole().getName();

        // Provera prava pristupa
        if (!userRole.equals("ADMIN") && !userRole.equals("EMPLOYEE")) {
            throw new UnauthorizedAccessException("Samo admin i zaposleni mogu videti rezervacije po lokaciji");
        }

        // Provera da li zaposleni pristupa svojoj lokaciji
        if (userRole.equals("EMPLOYEE")) {
            Long employeeLocationId = getLocationIdFromToken();
            if (!employeeLocationId.equals(locationId)) {
                throw new UnauthorizedAccessException("Možete videti samo rezervacije na svojoj lokaciji");
            }
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        List<Reservation> reservations = reservationRepository
                .findByAppointmentLocationIdAndAppointmentStartTimeBetween(
                        locationId, startOfDay, endOfDay);

        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean checkReservationExists(Long appointmentId) {
        return reservationRepository.existsByAppointmentId(appointmentId);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getCurrentMemberReservations() {
        User currentUser = getCurrentUserWithLocation();

        if (!currentUser.getRole().getName().equals("MEMBER")) {
            throw new UnauthorizedAccessException("Samo članovi mogu pristupiti svojim rezervacijama");
        }

        // Pronađi member-a za trenutnog user-a
        Member member = memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        List<Reservation> reservations = reservationRepository.findByMemberId(member.getId());

        return reservations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


private void validateReservationAccess(User user, Appointment appointment) {
    String userRole = user.getRole().getName();

    if (userRole.equals("ADMIN")) {
        return;
    }

    if (userRole.equals("EMPLOYEE")) {
        Long userLocationId = getLocationIdFromToken();

        if (userLocationId == null || !userLocationId.equals(appointment.getLocation().getId())) {
            throw new UnauthorizedAccessException(
                    "Možete pristupiti rezervacijama samo na svojoj lokaciji"
            );
        }
        return;
    }

    if (userRole.equals("MEMBER")) {
//        // Član može pristupiti rezervacijama samo za svoje termine
//        Member member = memberRepository.findByUserId(user.getId())
//                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));
//
//        // Proveri da li appointment pripada ovom članu
//        if (appointment.getMember() != null && !member.getId().equals(appointment.getMember().getId())) {
//            throw new UnauthorizedAccessException("Možete pristupiti samo svojim terminima");
//        }
        return;
    }

    throw new UnauthorizedAccessException("Nemaš pravo pristupa");
}
    private void validateReservation(Appointment appointment, Member member, Purchase purchase) {
        // 1. Provera kapaciteta
        if (appointment.getCurrentCapacity() >= appointment.getMaxCapacity()) {
            throw new ValidationException("Termin je popunjen. Nema slobodnih mesta.");
        }

        // 2. Provera da li ČLAN već ima rezervaciju za ovaj appointment
        boolean alreadyReservedByMember = reservationRepository.existsByMemberIdAndAppointmentId(
                member.getId(), appointment.getId());

        if (alreadyReservedByMember) {
            throw new ValidationException("Već imate rezervaciju za ovaj termin");
        }

        // 3. Provera da li je kupovina validna
        validatePurchaseForReservation(purchase, appointment, member);

        // 4. Provera da li je appointment još uvek aktivan
        if ("CANCELLED".equals(appointment.getStatus())) {
            throw new ValidationException("Termin je otkazan");
        }

//        // 5. Dodatna provera: da li appointment ima member-a? (možda je za grupe)
//        // Ako appointment ima member-a, to znači da je privatni termin za tog člana
//        // Ako nema member-a, to je grupni termin
//        if (appointment.getMember() != null && !appointment.getMember().getId().equals(member.getId())) {
//            throw new ValidationException("Ovaj termin je rezervisan za drugog člana");
//        }
    }


    private void validatePurchaseForReservation(Purchase purchase, Appointment appointment, Member member) {
        // 1. Provera da li kupovina pripada članu
        if (!purchase.getMember().getId().equals(member.getId())) {
            throw new ValidationException("Kupovina ne pripada ovom članu");
        }

        // 2. Provera da li je kupovina aktivna
        if (!purchase.getStatus().equals(Purchase.Status.ACTIVE)) {
            throw new ValidationException("Kupovina nije aktivna. Status: " + purchase.getStatus());
        }

        // 3. Provera da li kupovina ima preostale upotrebe
        if (purchase.getRemainingUses() <= 0) {
            throw new ValidationException("Nemate preostalih sesija u paketu");
        }

        // 4. Provera da li je kupovina istekla
        if (purchase.getExpiryDate() != null && purchase.getExpiryDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Kupovina je istekla " + purchase.getExpiryDate());
        }

        // 5. Provera da li kupovina važi za ovu uslugu
        if (!purchase.getService().getId().equals(appointment.getService().getId())) {
            throw new ValidationException("Kupovina nije za ovu vrstu usluge");
        }
    }

    private ReservationResponseDTO mapToResponse(Reservation reservation) {
        ReservationResponseDTO.ReservationResponseDTOBuilder builder = ReservationResponseDTO.builder()
                .id(reservation.getId())
                .notes(reservation.getNotes())
                .status(reservation.getStatus() != null ? reservation.getStatus().name() : null)
                .createdAt(reservation.getCreatedAt())
                .updatedAt(reservation.getUpdatedAt());

        // Member
        if (reservation.getMember() != null) {
            builder.memberId(reservation.getMember().getId());

            String memberFirstName = reservation.getMember().getFirstName();
            String memberLastName = reservation.getMember().getLastName();
            String memberFullName = (memberFirstName != null ? memberFirstName : "") +
                    " " +
                    (memberLastName != null ? memberLastName : "");
            builder.memberName(memberFullName.trim());
        }

        // Appointment
        if (reservation.getAppointment() != null) {
            builder.appointmentId(reservation.getAppointment().getId());
            builder.appointmentStartTime(reservation.getAppointment().getStartTime());
            builder.appointmentEndTime(reservation.getAppointment().getEndTime());

            // Service iz Appointment-a
            if (reservation.getAppointment().getService() != null) {
                builder.serviceName(reservation.getAppointment().getService().getName());
            }

            // Location iz Appointment-a
            if (reservation.getAppointment().getLocation() != null) {
                builder.locationName(reservation.getAppointment().getLocation().getName());
                builder.locationId(reservation.getAppointment().getLocation().getId());
            }
        }

        // Purchase
        if (reservation.getPurchase() != null) {
            builder.purchaseId(reservation.getPurchase().getId());

            // Service iz Purchase-a
            if (reservation.getPurchase().getService() != null) {
                builder.purchaseName(reservation.getPurchase().getService().getName());
            }
        }

        return builder.build();
    }
}