package com.bid.auction_service.payment.controller;

import com.bid.auction_service.payment.entity.Payment;
import com.bid.auction_service.payment.service.PaymentService;

import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // Create Order
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) {
        try {
            System.out.println("DEBUG: Received payment request: " + data);
            Long auctionId = Long.parseLong(data.get("auctionId").toString());
            String userId = data.get("userId").toString(); // Get from data as String
            Double amount = Double.parseDouble(data.get("amount").toString());

            Payment payment = paymentService.createOrder(auctionId, userId, amount);
            return ResponseEntity.ok(payment);
        } catch (RazorpayException e) {
            System.err.println("RAZORPAY EXCEPTION: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating order: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("GENERAL EXCEPTION: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Verify Payment
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data) {
        try {
            String orderId = data.get("razorpay_order_id");
            String paymentId = data.get("razorpay_payment_id");
            String signature = data.get("razorpay_signature");

            Payment updatedPayment = paymentService.verifyPayment(orderId, paymentId, signature);
            return ResponseEntity.ok(updatedPayment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Verification failed: " + e.getMessage());
        }
    }

    // Get All Payments (Admin)
    @GetMapping("/all")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}
