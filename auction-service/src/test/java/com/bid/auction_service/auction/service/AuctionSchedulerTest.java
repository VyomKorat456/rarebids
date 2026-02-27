package com.bid.auction_service.auction.service;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.enums.AuctionStatus;
import com.bid.auction_service.auction.repository.AuctionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuctionSchedulerTest {

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private SimpMessagingTemplate simpMessagingTemplate;

    @Mock
    private AuctionService auctionService;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuctionScheduler auctionScheduler;

    @Test
    void shouldDoNothingWhenNoLiveAuctions() {

        // Arrange
        when(auctionRepository.findByStatus(AuctionStatus.LIVE))
                .thenReturn(List.of());

        // Act
        auctionScheduler.monitorLiveAuctions();

        // Assert
        verify(auctionService, never()).stopAuction(anyLong());
    }

    @Test
    void shouldNotStopAuctionIfNotExpired() {

        // Arrange
        Auction auction = new Auction();
        auction.setId(1L);

        when(auctionRepository.findByStatus(AuctionStatus.LIVE))
                .thenReturn(List.of(auction));

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        LocalDateTime futureTime = LocalDateTime.now().plusMinutes(5);
        when(valueOperations.get("auction:1:endTime"))
                .thenReturn(futureTime.toString());

        // Act
        auctionScheduler.monitorLiveAuctions();

        // Assert
        verify(auctionService, never()).stopAuction(anyLong());
    }

    @Test
    void shouldStopAuctionIfExpired() {

        // Arrange
        Auction auction = new Auction();
        auction.setId(1L);

        when(auctionRepository.findByStatus(AuctionStatus.LIVE))
                .thenReturn(List.of(auction));

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        LocalDateTime pastTime = LocalDateTime.now().minusMinutes(5);
        when(valueOperations.get("auction:1:endTime"))
                .thenReturn(pastTime.toString());

        // Act
        auctionScheduler.monitorLiveAuctions();

        // Assert
        verify(auctionService, times(1)).stopAuction(1L);
    }
}