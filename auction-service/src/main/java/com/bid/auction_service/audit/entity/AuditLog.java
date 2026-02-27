package com.bid.auction_service.audit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "audit_logs")
@AllArgsConstructor
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long entityId; // e.g., Auction ID
    private String entityType; // e.g., AUCTION, USER, BID

    private String action; // e.g., CREATED, UPDATED, DELETED, PLACED

    @Column(length = 1000)
    private String details;

    private String performedBy; // User ID

    private LocalDateTime timestamp;

}
