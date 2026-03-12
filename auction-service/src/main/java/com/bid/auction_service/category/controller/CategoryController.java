package com.bid.auction_service.category.controller;

import com.bid.auction_service.category.entity.Category;
import com.bid.auction_service.category.service.CategoryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // Public / Users to view (Only APPROVED)
    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    // User to Request a new Category
    @PostMapping("/categories/request")
    public ResponseEntity<Category> requestCategory(@RequestBody Category category, @AuthenticationPrincipal Jwt jwt) {
        if (jwt != null) {
            category.setRequestedBy(jwt.getSubject());
        }
        category.setStatus(com.bid.auction_service.category.enums.CategoryStatus.PENDING);
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    // Admin to view pending
    @GetMapping("/admin/categories/pending")
    public List<Category> getPendingCategories() {
        return categoryService.getPendingRequests();
    }

    // Admin to Approve
    @PutMapping("/admin/categories/{id}/approve")
    public ResponseEntity<Category> approveCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.approveCategory(id));
    }

    // Admin to Reject
    @PutMapping("/admin/categories/{id}/reject")
    public ResponseEntity<Category> rejectCategory(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.rejectCategory(id));
    }

    // Admin to Create directly (Auto-Approved)
    @PostMapping("/admin/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        category.setStatus(com.bid.auction_service.category.enums.CategoryStatus.APPROVED);
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    // Admin to Delete
    @DeleteMapping("/admin/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
