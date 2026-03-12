package com.bid.auction_service.category.service;

import com.bid.auction_service.category.entity.Category;
import com.bid.auction_service.category.repository.CategoryRepository;
import com.bid.auction_service.category.enums.CategoryStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findByStatus(CategoryStatus.APPROVED);
    }

    public List<Category> getPendingRequests() {
        return categoryRepository.findByStatus(CategoryStatus.PENDING);
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category approveCategory(Long id) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
        category.setStatus(CategoryStatus.APPROVED);
        return categoryRepository.save(category);
    }

    public Category rejectCategory(Long id) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
        category.setStatus(CategoryStatus.REJECTED);
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
