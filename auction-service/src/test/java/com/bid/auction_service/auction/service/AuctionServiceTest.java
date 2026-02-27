package com.bid.auction_service.auction.service;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.enums.AuctionStatus;
import com.bid.auction_service.auction.repository.AuctionRepository;
import com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO;
import com.bid.auction_service.bidding.repository.BidRepository;
import com.bid.auction_service.user.service.CachedUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuctionServiceTest {

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SetOperations<String, String> setOperations;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private CachedUserService cachedUserService;

    @Mock
    private BidRepository bidRepository;

    @InjectMocks
    private AuctionService auctionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(auctionService, "uploadDir", "test-uploads");
    }

    @Test
    void createAuction_Success() throws IOException {
        Auction auction = new Auction();
        auction.setStartPrice(1000.0);
        MockMultipartFile image = new MockMultipartFile("image", "test.jpg", "image/jpeg", "test data".getBytes());

        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Auction result = auctionService.createAuction(auction, image);

        assertNotNull(result);
        assertEquals(AuctionStatus.PENDING, result.getStatus());
        assertTrue(result.getImageUrl().startsWith("/images/"));
        verify(auctionRepository).save(auction);
    }

    @Test
    void createAuction_PriceExceeded() {
        Auction auction = new Auction();
        auction.setStartPrice(600000.0);

        assertThrows(IllegalArgumentException.class, () -> auctionService.createAuction(auction, null));
    }

    @Test
    void startLiveAuction_Success() {
        Auction auction = new Auction();
        auction.setId(1L);
        auction.setStatus(AuctionStatus.OPEN);
        auction.setCurrentPrice(100.0);

        when(auctionRepository.findById(1L)).thenReturn(Optional.of(auction));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForSet()).thenReturn(setOperations);

        auctionService.startLiveAuction(1L);

        assertEquals(AuctionStatus.LIVE, auction.getStatus());
        verify(valueOperations, atLeastOnce()).set(contains("highestBid"), anyString());
        verify(messagingTemplate).convertAndSend(eq("/topic/auction/1"), any(AuctionLiveUpdateDTO.class));
    }

    @Test
    void joinAuction_ParticipantTracking() {
        Long auctionId = 1L;
        String userId = "user123";
        Auction auction = new Auction();
        auction.setStartPrice(100.0);
        auction.setStatus(AuctionStatus.OPEN);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));
        when(valueOperations.get(anyString())).thenReturn(null); // No masked ID yet

        auctionService.joinAuction(auctionId, userId, false);

        verify(setOperations).add(contains("participants"), eq(userId));
        verify(valueOperations).set(contains("maskedId"), contains("Bidder#"));
    }

    @Test
    void stopAuction_WithWinner() {
        Long id = 1L;
        Auction auction = new Auction();
        auction.setId(id);
        auction.setStatus(AuctionStatus.LIVE);
        auction.setStartPrice(100.0);

        when(auctionRepository.findById(id)).thenReturn(Optional.of(auction));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(contains("highestBidUser"))).thenReturn("winner123");
        when(redisTemplate.opsForSet()).thenReturn(setOperations);

        auctionService.stopAuction(id);

        assertEquals(AuctionStatus.SOLD, auction.getStatus());
        assertEquals("winner123", auction.getWinnerId());
        verify(auctionRepository).save(auction);
        verify(redisTemplate).delete(anySet());
    }

    @Test
    void cleanupUnpaidAuctions_Logic() {
        Auction unpaid = new Auction();
        unpaid.setId(1L);
        unpaid.setStatus(AuctionStatus.SOLD);
        unpaid.setEndTime(LocalDateTime.now().minusMinutes(40));
        unpaid.setStartPrice(100.0);

        when(auctionRepository.findByStatusAndPaidFalse(AuctionStatus.SOLD))
                .thenReturn(Collections.singletonList(unpaid));
        // Mocking broadcast dependencies
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(unpaid));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForSet()).thenReturn(setOperations);

        auctionService.cleanupUnpaidAuctions();

        assertEquals(AuctionStatus.UNSOLD, unpaid.getStatus());
        assertNull(unpaid.getWinnerId());
        verify(auctionRepository).save(unpaid);
    }
}
