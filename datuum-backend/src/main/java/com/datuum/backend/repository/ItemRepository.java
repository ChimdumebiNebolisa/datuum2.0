package com.datuum.backend.repository;

import com.datuum.backend.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    
    // Custom query methods can be added here
    List<Item> findByNameContainingIgnoreCase(String name);
}

