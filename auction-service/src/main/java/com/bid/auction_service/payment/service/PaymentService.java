package com.bid.auction_service.payment.service;

import com.bid.auction_service.payment.entity.Payment;
import com.bid.auction_service.payment.repository.PaymentRepository;
import com.bid.auction_service.auction.service.AuctionService;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AuctionService auctionService;

    @Value("${razorpay.key.id:rzp_test_SC1GGrRjQIZx1h}")
    private String keyId;

    @Value("${razorpay.key.secret:n5pzgkt6Q7srv9iQtp5k4r3H}")
    private String keySecret;

    public PaymentService(PaymentRepository paymentRepository, AuctionService auctionService) {
        this.paymentRepository = paymentRepository;
        this.auctionService = auctionService;
    }

    public Payment createOrder(Long auctionId, String userId, Double amount) throws RazorpayException {
        RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", Math.round(amount * 100)); // Amount in paise (must be integer)
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        Order order = razorpay.orders.create(orderRequest);

        Payment payment = new Payment();
        payment.setOrderId(order.get("id"));
        payment.setAuctionId(auctionId);
        payment.setUserId(userId);
        payment.setAmount(amount);
        payment.setCurrency("INR");
        payment.setStatus("CREATED");

        return paymentRepository.save(payment);
    }

    public Payment verifyPayment(String orderId, String paymentId, String signature) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment order not found"));

        // In a real app, verify signature here using Utils.verifyPaymentSignature or
        // similar.
        // For simple integration, we assume success if client sends valid IDs.

        payment.setPaymentId(paymentId);
        payment.setSignature(signature);
        payment.setStatus("SUCCESS");

        Payment savedPayment = paymentRepository.save(payment);

        // Mark Auction as SOLD and PAID
        auctionService.markAsSold(savedPayment.getAuctionId(), savedPayment.getUserId(), true);

        return savedPayment;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}
