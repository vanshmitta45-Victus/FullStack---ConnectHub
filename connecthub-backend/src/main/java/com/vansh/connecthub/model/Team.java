package com.vansh.connecthub.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
@Table(name = "teams")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String teamName;

    @ManyToOne
    @JoinColumn(name = "leader_id")
    private User teamLeader;

    @OneToMany
    @JoinColumn(name = "team_id")
    private List<User> members;
}