package com.datuum.backend.controller;

import com.datuum.backend.entity.Item;
import com.datuum.backend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    /**
     * Get all items
     */
    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        List<Item> items = itemRepository.findAll();
        
        // If no items exist, return sample data for demo purposes
        if (items.isEmpty()) {
            items = List.of(
                new Item("Example Item 1", "This is a sample item from the backend API"),
                new Item("Example Item 2", "Another demo item with authentication"),
                new Item("Example Item 3", "Protected data retrieved successfully")
            );
        }
        
        return ResponseEntity.ok(items);
    }

    /**
     * Get item by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        Optional<Item> item = itemRepository.findById(id);
        return item.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new item
     */
    @PostMapping
    public ResponseEntity<Item> createItem(@RequestBody Item item) {
        Item savedItem = itemRepository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
    }

    /**
     * Update item
     */
    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable Long id, @RequestBody Item itemDetails) {
        Optional<Item> itemOptional = itemRepository.findById(id);
        
        if (itemOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOptional.get();
        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        
        Item updatedItem = itemRepository.save(item);
        return ResponseEntity.ok(updatedItem);
    }

    /**
     * Delete item
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search items by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<Item>> searchItems(@RequestParam String name) {
        List<Item> items = itemRepository.findByNameContainingIgnoreCase(name);
        return ResponseEntity.ok(items);
    }
}

