package com.bid.auth_service.config;

import com.bid.auth_service.entity.User;
import com.bid.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByUsername("blakie")) {
                User admin = User.builder()
                        .username("blakie")
                        .email("blakie@admin.com")
                        .password(passwordEncoder.encode("1234"))
                        .firstName("Admin")
                        .lastName("Blakie")
                        .roles(Set.of("USER", "ADMIN"))
                        .enabled(true)
                        .build();
                userRepository.save(admin);
                System.out.println(">>> SEEDED ADMIN USER: blakie");
            }
        };
    }
}
