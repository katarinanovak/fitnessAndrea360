package com.example.fitnessAndrea360.service;

import com.example.fitnessAndrea360.dto.MemberRequestDTO;
import com.example.fitnessAndrea360.dto.MemberResponseDTO;
import com.example.fitnessAndrea360.exception.ResourceNotFoundException;
import com.example.fitnessAndrea360.exception.UnauthorizedAccessException;
import com.example.fitnessAndrea360.exception.ValidationException;
import com.example.fitnessAndrea360.model.*;
import com.example.fitnessAndrea360.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    //  pomoćna metoda za dobijanje trenutnog User entiteta SA LOKACIJOM
    private User getCurrentUserWithLocation() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        // Učitaj korisnika SA lokacijom
        return userRepository.findByEmailWithLocation(email)
                .orElseThrow(() -> new RuntimeException("Trenutni korisnik nije pronađen u bazi"));
    }

    @Transactional
    public MemberResponseDTO createMember(MemberRequestDTO request) {

        validateMemberRequest(request);

        // 2. Dobijanje trenutno prijavljenog korisnika SA LOKACIJOM
        User currentUser = getCurrentUserWithLocation();

        // 3. Ako je EMPLOYEE, automatski koristi NJEGOVU lokaciju, a ne locationId iz requesta
        Long targetLocationId;
        if (currentUser.getRole().getName().equals("EMPLOYEE")) {
            if (currentUser.getLocation() == null) {
                throw new UnauthorizedAccessException("Zaposleni nema dodeljenu lokaciju");
            }
            // Employee MORA da kreira člana za SVOJU lokaciju
            targetLocationId = currentUser.getLocation().getId();

            // IGNORIŠI locationId iz requesta i koristi zaposlenog lokaciju
            // Ovo osigurava da employee ne može kreirati člana za drugu lokaciju
        } else if (currentUser.getRole().getName().equals("ADMIN")) {
            // Admin može da bira lokaciju
            targetLocationId = request.getLocationId();
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo da kreiraš članove");
        }

        // 4. Provera da li email već postoji
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email već postoji u sistemu");
        }

        // 5. Provera da li email već postoji u User tabeli
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email već postoji u sistemu");
        }

        // 6. Provera da li username već postoji (ako se koristi)
        if (request.getUsername() != null && !request.getUsername().isEmpty() &&
                userRepository.existsByUsername(request.getUsername())) {
            throw new ValidationException("Korisničko ime već postoji");
        }

        // 7. Dobijanje lokacije
        Location location = locationRepository.findById(targetLocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lokacija nije pronađena"));

        // 8. Pronalaženje MEMBER role
        Role memberRole = roleRepository.findByName("MEMBER")
                .orElseThrow(() -> new ResourceNotFoundException("MEMBER role nije pronađena"));

        // 9. Kreiranje User naloga za člana
        User memberUser = new User();
        memberUser.setEmail(request.getEmail());
        memberUser.setPassword(passwordEncoder.encode(request.getPassword()));
        memberUser.setFirstName(request.getFirstName());
        memberUser.setLastName(request.getLastName());

        // Ako je username prazan, koristi email kao username
        if (request.getUsername() == null || request.getUsername().isEmpty()) {
            memberUser.setUsername(request.getEmail());
        } else {
            memberUser.setUsername(request.getUsername());
        }

        memberUser.setRole(memberRole);
        memberUser.setIsActive(true);
        memberUser.setLocation(location);
        memberUser.setPhone(request.getPhone());
        memberUser = userRepository.save(memberUser);

        // 10. Kreiranje Member entiteta
        Member member = new Member();
        member.setFirstName(request.getFirstName());
        member.setLastName(request.getLastName());
        member.setUser(memberUser);
        member.setLocation(location);
        member.setEmail(request.getEmail());
        member.setPhone(request.getPhone());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setGender(request.getGender());
        member.setAddress(request.getAddress());
        member.setEmergencyContact(request.getEmergencyContact());
        member.setEmergencyPhone(request.getEmergencyPhone());
        member.setMembershipStartDate(request.getMembershipStartDate());
        member.setMembershipEndDate(request.getMembershipEndDate());
        member.setMembershipStatus(Member.MembershipStatus.ACTIVE);
        member.setMedicalNotes(request.getMedicalNotes());
        member.setNotes(request.getNotes());
        member.setCreatedBy(currentUser);

        member = memberRepository.save(member);

        return mapToResponse(member);
    }

    private void validateMemberRequest(MemberRequestDTO request) {
        // Provera da li je datum isteka nakon datuma početka
        if (request.getMembershipEndDate().isBefore(request.getMembershipStartDate())) {
            throw new ValidationException("Datum isteka članstva mora biti nakon datuma početka");
        }

        // Provera da li je članstvo minimalno 1 mesec
        if (request.getMembershipStartDate().plusMonths(1).isAfter(request.getMembershipEndDate())) {
            throw new ValidationException("Članstvo mora trajati najmanje 1 mesec");
        }

        // Provera da li je osoba punoletna (18+ godina)
        LocalDate eighteenYearsAgo = LocalDate.now().minusYears(18);
        if (request.getDateOfBirth().isAfter(eighteenYearsAgo)) {
            throw new ValidationException("Član mora biti punoletan (18+ godina)");
        }
    }

    public List<MemberResponseDTO> getAllMembers() {
        User currentUser = getCurrentUserWithLocation();

        List<Member> members;

        if (currentUser.getRole().getName().equals("ADMIN")) {
            // Admin vidi sve članove
            members = memberRepository.findAll();
        } else if (currentUser.getRole().getName().equals("EMPLOYEE")) {
            // Employee vidi članove samo sa svoje lokacije
            if (currentUser.getLocation() == null) {
                throw new UnauthorizedAccessException("Zaposleni nema dodeljenu lokaciju");
            }
            members = memberRepository.findByLocationId(currentUser.getLocation().getId());
        } else {
            throw new UnauthorizedAccessException("Nemaš pravo pristupa");
        }

        return members.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public MemberResponseDTO getMemberById(Long id) {
        User currentUser = getCurrentUserWithLocation();

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        // Provera pristupa
        validateMemberAccess(currentUser, member);

        return mapToResponse(member);
    }

    public List<MemberResponseDTO> getMembersByLocation(Long locationId) {
        User currentUser = getCurrentUserWithLocation();

        // Provera prava pristupa
        if (!currentUser.getRole().getName().equals("ADMIN") &&
                !(currentUser.getRole().getName().equals("EMPLOYEE") &&
                        currentUser.getLocation() != null &&
                        currentUser.getLocation().getId().equals(locationId))) {
            throw new UnauthorizedAccessException("Nemaš pravo da vidiš članove ove lokacije");
        }

        List<Member> members = memberRepository.findByLocationId(locationId);
        return members.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MemberResponseDTO updateMember(Long id, MemberRequestDTO request) {
        // Dobijanje člana
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        // Provera prava pristupa
        User currentUser = getCurrentUserWithLocation();
        validateMemberAccess(currentUser, member);

        // Validacija
        validateMemberRequest(request);

        // Provera da li email već postoji (ako se promenio)
        if (!member.getEmail().equals(request.getEmail()) &&
                memberRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email već postoji u sistemu");
        }

        // Provera da li email već postoji u User tabeli (ako se promenio)
        if (!member.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email već postoji u sistemu");
        }

        // Ako je EMPLOYEE, NIJE DOZVOLJENO menjati lokaciju člana
        if (currentUser.getRole().getName().equals("EMPLOYEE")) {
            // Employee može da ažurira samo članove sa svoje lokacije
            if (!member.getLocation().getId().equals(currentUser.getLocation().getId())) {
                throw new UnauthorizedAccessException("Možete ažurirati samo članove sa svoje lokacije");
            }
            // Employee NE SME da menja lokaciju člana
            // Ignoriši locationId iz requesta
        } else if (currentUser.getRole().getName().equals("ADMIN")) {
            // Admin može da menja lokaciju
            if (request.getLocationId() != null && !request.getLocationId().equals(member.getLocation().getId())) {
                Location newLocation = locationRepository.findById(request.getLocationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Lokacija nije pronađena"));
                member.setLocation(newLocation);
                member.getUser().setLocation(newLocation);
            }
        }

        // Ažuriranje Member entiteta
        member.setFirstName(request.getFirstName());
        member.setLastName(request.getLastName());
        member.setEmail(request.getEmail());
        member.setPhone(request.getPhone());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setGender(request.getGender());
        member.setAddress(request.getAddress());
        member.setEmergencyContact(request.getEmergencyContact());
        member.setEmergencyPhone(request.getEmergencyPhone());
        member.setMembershipStartDate(request.getMembershipStartDate());
        member.setMembershipEndDate(request.getMembershipEndDate());
        member.setMedicalNotes(request.getMedicalNotes());
        member.setNotes(request.getNotes());

        // Ažuriranje User entiteta
        User memberUser = member.getUser();
        memberUser.setEmail(request.getEmail());
        memberUser.setFirstName(request.getFirstName());
        memberUser.setLastName(request.getLastName());
        memberUser.setPhone(request.getPhone());

        // Ažuriranje username ako se email promenio
        if (!member.getEmail().equals(request.getEmail())) {
            // Proveri da li želiš da promeniš i username
            if (request.getUsername() != null && !request.getUsername().isEmpty()) {
                // Provera da li novi username već postoji
                if (!memberUser.getUsername().equals(request.getUsername()) &&
                        userRepository.existsByUsername(request.getUsername())) {
                    throw new ValidationException("Korisničko ime već postoji");
                }
                memberUser.setUsername(request.getUsername());
            } else {
                // Ako nije unet username, koristi email
                memberUser.setUsername(request.getEmail());
            }
        }

        userRepository.save(memberUser);
        member = memberRepository.save(member);

        return mapToResponse(member);
    }

    @Transactional
    public void deleteMember(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        // Provera prava pristupa
        User currentUser = getCurrentUserWithLocation();
        validateMemberAccess(currentUser, member);

        // Deaktivacija User naloga
        member.getUser().setIsActive(false);
        userRepository.save(member.getUser());

        // Ažuriranje statusa članstva
        member.setMembershipStatus(Member.MembershipStatus.INACTIVE);
        memberRepository.save(member);
    }

    @Transactional
    public MemberResponseDTO updateMembershipStatus(Long id, Member.MembershipStatus newStatus) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen"));

        // Provera prava pristupa
        User currentUser = getCurrentUserWithLocation();
        validateMemberAccess(currentUser, member);

        member.setMembershipStatus(newStatus);
        member = memberRepository.save(member);

        return mapToResponse(member);
    }

    private void validateMemberAccess(User user, Member member) {
        String userRole = user.getRole().getName();

        if (userRole.equals("ADMIN")) {
            return; // Admin vidi sve
        }

        if (userRole.equals("EMPLOYEE")) {
            if (user.getLocation() == null || !user.getLocation().getId().equals(member.getLocation().getId())) {
                throw new UnauthorizedAccessException("Možete pristupiti samo članovima sa svoje lokacije");
            }
            return;
        }

        if (userRole.equals("MEMBER")) {
            if (!user.getId().equals(member.getUser().getId())) {
                throw new UnauthorizedAccessException("Možete pristupiti samo svom profilu");
            }
            return;
        }

        throw new UnauthorizedAccessException("Nemaš pravo pristupa");
    }

    private MemberResponseDTO mapToResponse(Member member) {
        return MemberResponseDTO.builder()
                .id(member.getId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .dateOfBirth(member.getDateOfBirth())
                .gender(member.getGender())
                .address(member.getAddress())
                .emergencyContact(member.getEmergencyContact())
                .emergencyPhone(member.getEmergencyPhone())
                .membershipStartDate(member.getMembershipStartDate())
                .membershipEndDate(member.getMembershipEndDate())
                .membershipStatus(member.getMembershipStatus())
                .medicalNotes(member.getMedicalNotes())
                .notes(member.getNotes())
                .locationId(member.getLocation().getId())
                .locationName(member.getLocation().getName())
                .createdById(member.getCreatedBy() != null ? member.getCreatedBy().getId() : null)
                .createdByName(member.getCreatedBy() != null ?
                        member.getCreatedBy().getFirstName() + " " + member.getCreatedBy().getLastName() : null)
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .userId(member.getUser().getId())
                .username(member.getUser().getUsername())
                .build();
    }


    //dodato zbog purchase


    /**
     * Pronalazi Member-a po User ID-u
     */
    public Member getMemberByUserId(Long userId) {
        return memberRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen za user ID: " + userId));
    }

    /**
     * Pronalazi Member-a po username-u
     */
    public Member getMemberByUsername(String username) {
        return memberRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Član nije pronađen za username: " + username));
    }

    /**
     * Pronalazi Member-a za trenutno ulogovanog korisnika
     */
    public Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        return getMemberByUsername(currentUsername);
    }
}