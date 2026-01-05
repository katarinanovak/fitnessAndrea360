package com.example.fitnessAndrea360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableWebMvc
public class FitnessAndrea360Application {

	public static void main(String[] args) {
		SpringApplication.run(FitnessAndrea360Application.class, args);
	}

}
