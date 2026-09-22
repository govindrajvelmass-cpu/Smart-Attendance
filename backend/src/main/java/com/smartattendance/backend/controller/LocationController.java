package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.LocationDto;
import com.smartattendance.backend.dto.response.ApiResponse;
import com.smartattendance.backend.entity.Location;
import com.smartattendance.backend.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Location> getLocationById(@PathVariable Long id) {
        return ResponseEntity.ok(locationService.getLocationById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<Location> createLocation(@Valid @RequestBody LocationDto dto) {
        return new ResponseEntity<>(locationService.createLocation(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<Location> updateLocation(@PathVariable Long id, @Valid @RequestBody LocationDto dto) {
        return ResponseEntity.ok(locationService.updateLocation(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.ok("Location preset deleted successfully"));
    }
}
