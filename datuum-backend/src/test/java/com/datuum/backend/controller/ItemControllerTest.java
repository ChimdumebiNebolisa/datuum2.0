package com.datuum.backend.controller;

import com.datuum.backend.entity.Item;
import com.datuum.backend.repository.ItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ItemRepository itemRepository;

    @Test
    @WithMockUser
    void getAllItems_shouldReturnItems() throws Exception {
        Item item1 = new Item("Test Item 1", "Description 1");
        Item item2 = new Item("Test Item 2", "Description 2");

        when(itemRepository.findAll()).thenReturn(Arrays.asList(item1, item2));

        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].name").value("Test Item 1"));
    }

    @Test
    @WithMockUser
    void getItemById_shouldReturnItem() throws Exception {
        Item item = new Item("Test Item", "Test Description");
        item.setId(1L);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));

        mockMvc.perform(get("/api/items/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Item"));
    }

    @Test
    @WithMockUser
    void createItem_shouldReturnCreatedItem() throws Exception {
        Item item = new Item("New Item", "New Description");
        item.setId(1L);

        when(itemRepository.save(any(Item.class))).thenReturn(item);

        String itemJson = "{\"name\":\"New Item\",\"description\":\"New Description\"}";

        mockMvc.perform(post("/api/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(itemJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Item"));
    }

    @Test
    void getAllItems_withoutAuth_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/items"))
                .andExpect(status().isUnauthorized());
    }
}

