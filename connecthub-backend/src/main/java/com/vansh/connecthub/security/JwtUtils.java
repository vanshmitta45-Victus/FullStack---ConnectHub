package com.vansh.connecthub.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    private final String jwtSecret = "secretKey000000000000000000000000000000000000000000000000000000000000";
    private final long jwtExpirationMs = 7L * 24 * 60 * 60 * 1000; // 7 Days (604,800,000 ms)

    private final Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateToken(org.springframework.security.core.Authentication authentication) {
        return generateToken(authentication.getName());
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
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