package com.smartattendance.backend.dto.response;

import com.smartattendance.backend.entity.Role;

public class UserSummaryDto {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private String name;
    private String identifier;
    private Long profileId; // Student ID or Teacher ID

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String username, String email, Role role, String name, String identifier, Long profileId) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.name = name;
        this.identifier = identifier;
        this.profileId = profileId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }
}
