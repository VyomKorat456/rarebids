package com.bid.auction_service.audit.service;

import com.bid.auction_service.audit.entity.AuditLog;
import com.bid.auction_service.audit.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logAuctionEvent(Long auctionId, String status, String message) {
        AuditLog log = new AuditLog();
        log.setEntityId(auctionId);
        log.setEntityType("AUCTION");
        log.setAction("STATUS_CHANGE");
        log.setDetails("Status changed to: " + status + ". " + (message != null ? message : ""));
        log.setTimestamp(LocalDateTime.now());
        log.setPerformedBy("SYSTEM");

        auditLogRepository.save(log);
        System.out.println("Audit Logged: Auction Event - " + status);
    }

    public void logBidEvent(Long auctionId, String userId, Double amount) {
        AuditLog log = new AuditLog();
        log.setEntityId(auctionId);
        log.setEntityType("BID");
        log.setAction("BID_PLACED");
        log.setDetails("Bid amount: " + amount);
        log.setTimestamp(LocalDateTime.now());
        log.setPerformedBy(userId);

        auditLogRepository.save(log);
        System.out.println("Audit Logged: Bid Event - " + amount);
    }
}
