package com.example.fitnessAndrea360.controller;

import com.example.fitnessAndrea360.dto.MemberRequestDTO;
import com.example.fitnessAndrea360.dto.MemberResponseDTO;
import com.example.fitnessAndrea360.model.Member;
import com.example.fitnessAndrea360.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Member Management", description = "API za upravljanje članovima fitness centra")
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Kreiraj novog člana",
            description = "Samo admin i zaposleni mogu kreirati članove. Zaposleni mogu kreirati članove samo za svoju lokaciju.")
    public ResponseEntity<MemberResponseDTO> createMember(@Valid @RequestBody MemberRequestDTO request) {
        MemberResponseDTO createdMember = memberService.createMember(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMember);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Vidi sve članove",
            description = "Admin vidi sve članove, zaposleni vidi samo članove sa svoje lokacije.")
    public ResponseEntity<List<MemberResponseDTO>> getAllMembers() {
        List<MemberResponseDTO> members = memberService.getAllMembers();
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('MEMBER')")
    @Operation(summary = "Vidi člana po ID-u",
            description = "Admin i zaposleni mogu videti bilo kog člana (zaposleni samo sa svoje lokacije). Članovi mogu videti samo svoj profil.")
    public ResponseEntity<MemberResponseDTO> getMemberById(@PathVariable Long id) {
        MemberResponseDTO member = memberService.getMemberById(id);
        return ResponseEntity.ok(member);
    }

    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Vidi članove po lokaciji",
            description = "Vidi sve članove određene lokacije.")
    public ResponseEntity<List<MemberResponseDTO>> getMembersByLocation(@PathVariable Long locationId) {
        List<MemberResponseDTO> members = memberService.getMembersByLocation(locationId);
        return ResponseEntity.ok(members);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Ažuriraj člana",
            description = "Ažuriraj podatke o članu.")
    public ResponseEntity<MemberResponseDTO> updateMember(
            @PathVariable Long id,
            @Valid @RequestBody MemberRequestDTO request) {
        MemberResponseDTO updatedMember = memberService.updateMember(id, request);
        return ResponseEntity.ok(updatedMember);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Deaktiviraj člana",
            description = "Deaktivira člana (postavlja status na INACTIVE).")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
    @Operation(summary = "Promeni status članstva",
            description = "Promeni status članstva (ACTIVE, INACTIVE, SUSPENDED, EXPIRED, etc.)")
    public ResponseEntity<MemberResponseDTO> updateMembershipStatus(
            @PathVariable Long id,
            @RequestParam Member.MembershipStatus status) {
        MemberResponseDTO updatedMember = memberService.updateMembershipStatus(id, status);
        return ResponseEntity.ok(updatedMember);
    }

//    @GetMapping("/my-profile")
//    @PreAuthorize("hasRole('MEMBER')")
//    @Operation(summary = "Vidi svoj profil",
//            description = "Član vidi svoj profil.")
//    public ResponseEntity<MemberResponseDTO> getMyProfile() {
//        return ResponseEntity.ok().build();
//    }
}