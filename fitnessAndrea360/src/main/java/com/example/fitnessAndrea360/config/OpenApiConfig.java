package com.example.fitnessAndrea360.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:fitness-center}")
    private String applicationName;

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Server with Context Path")
                ))
                .info(new Info()
                        .title("Fitness Center Management System API")
                        .version("1.0")
                        .description("""
                            ## 🏋️ Andrea360 Fullstack Challenge
                            
                            Complete fitness center management system with:
                            - **User Authentication** (JWT)
                            - **Role-based Access Control** (Admin, Employee, Member)
                            - **Location Management**
                            - **Service/Training Management**
                            - **Appointment Scheduling**
                            - **Real-time Booking** (WebSocket)
                            - **Online Payments** (Stripe)
                            - **Capacity Tracking**
                            
                            ### 🔐 Authentication
                            Use `/auth/login` to get JWT token, then add to header:
                            `Authorization: Bearer <token>`
                            
                            ### 👥 User Roles
                            - **ADMIN**: Full access
                            - **EMPLOYEE**: Manage appointments, members, services
                            - **MEMBER**: Book appointments, make purchases
                            """)
                        .contact(new Contact()
                                .name("Andrea360 Challenge")
                                .email("support@example.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token (without 'Bearer ' prefix)")));
    }
}