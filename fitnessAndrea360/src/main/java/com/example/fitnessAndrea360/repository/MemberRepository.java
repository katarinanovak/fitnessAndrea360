package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    //Optional<Member> findByUserId(Long userId);
    @Query("SELECT m FROM Member m WHERE m.user.id = :userId")
    Optional<Member> findByUserId(@Param("userId") Long userId);

    boolean existsByEmail(String email);

    boolean existsByUserId(Long userId);

    List<Member> findByLocationId(Long locationId);

    List<Member> findByCreatedById(Long createdById);

    List<Member> findByMembershipStatus(Member.MembershipStatus status);

    List<Member> findByLocationIdAndMembershipStatus(Long locationId, Member.MembershipStatus status);

    Optional<Member> findByUser_Id(Long userId);

    @Query("SELECT m FROM Member m WHERE m.user.username = :username")
    Optional<Member> findByUserUsername(@Param("username") String username);



    @Query("SELECT m FROM Member m WHERE m.user.email = :email")
    Optional<Member> findByUserEmail(@Param("email") String email);


}