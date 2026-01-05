package com.example.fitnessAndrea360.repository;

import com.example.fitnessAndrea360.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
}
