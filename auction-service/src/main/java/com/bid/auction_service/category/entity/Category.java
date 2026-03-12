package com.bid.auction_service.category.entity;

import jakarta.persistence.*;
import com.bid.auction_service.category.enums.CategoryStatus;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
public class Category {

    public Category() {}

    public Category(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    private CategoryStatus status = CategoryStatus.PENDING;

    private String requestedBy; // userId from JWT

}
