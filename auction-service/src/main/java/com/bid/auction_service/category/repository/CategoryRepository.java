package com.bid.auction_service.category.repository;

import com.bid.auction_service.category.entity.Category;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
