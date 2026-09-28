package com.vansh.connecthub.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        // 1. Bypass WebSocket handshakes and Auth endpoints (SockJS does not send Authorization HTTP headers)
        if (requestPath.startsWith("/ws") || requestPath.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // --- DIAGNOSTIC LOGS FOR REST APIS ---
        System.out.println("--- NEW INCOMING REQUEST ---");
        System.out.println("Target API: " + requestPath);

        String authHeader = request.getHeader("Authorization");
        System.out.println("Authorization Header Received: " + (authHeader != null ? "YES" : "NO"));

        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                if (jwtUtils.validateToken(token)) {
                    username = jwtUtils.getUsernameFromToken(token);
                    System.out.println("Token Validated! Extracted Username: " + username);
                } else {
                    System.out.println("SECURITY ALERT: Token is invalid or expired.");
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"Session expired or invalid token. Please log in again.\"}");
                    return;
                }
            } catch (Exception e) {
                System.out.println("JWT Validation Error: " + e.getMessage());
                response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"" + e.getMessage() + "\"}");
                return;
            }
        } else {
            System.out.println("SECURITY ALERT: No Bearer token found in request headers.");
        }

        if (username != null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}