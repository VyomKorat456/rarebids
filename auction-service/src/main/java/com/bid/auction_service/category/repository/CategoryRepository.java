package com.bid.auction_service.category.repository;

import com.bid.auction_service.category.entity.Category;
import com.bid.auction_service.category.enums.CategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByStatus(CategoryStatus status);
}
