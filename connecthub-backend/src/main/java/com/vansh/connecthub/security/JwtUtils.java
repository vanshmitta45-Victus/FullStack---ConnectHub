package com.vansh.connecthub.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    @Value("${app.jwt.secret:secretKey000000000000000000000000000000000000000000000000000000000000}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:604800000}")
    private long jwtExpirationMs;

    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateToken(org.springframework.security.core.Authentication authentication) {
        return generateToken(authentication.getName());
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            System.err.println("JWT Expired: " + e.getMessage());
            return false;
        } catch (SignatureException | MalformedJwtException e) {
            System.err.println("JWT Invalid signature or format: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("JWT Validation error: " + e.getMessage());
            return false;
        }
    }
}