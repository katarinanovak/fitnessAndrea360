package com.example.fitnessAndrea360.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "services")
@Getter
@Setter
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "price_eur", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceEur;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "max_capacity")
    private Integer maxCapacity = 20;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // MANY-TO-MANY sa Location
    @ManyToMany
    @JoinTable(
            name = "service_locations",
            joinColumns = @JoinColumn(name = "service_id"),
            inverseJoinColumns = @JoinColumn(name = "location_id")
    )
    private Set<Location> locations = new HashSet<>();

    // Ko je kreirao uslugu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}