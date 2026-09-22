package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.LocationDto;
import com.smartattendance.backend.entity.Location;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Location getLocationById(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location preset not found with id: " + id));
    }

    @Transactional
    public Location createLocation(LocationDto dto) {
        Location location = new Location(
                dto.getName(),
                dto.getLatitude(),
                dto.getLongitude(),
                dto.getDefaultRadius() != null ? dto.getDefaultRadius() : 50.0,
                dto.getDescription()
        );
        return locationRepository.save(location);
    }

    @Transactional
    public Location updateLocation(Long id, LocationDto dto) {
        Location location = getLocationById(id);
        location.setName(dto.getName());
        location.setLatitude(dto.getLatitude());
        location.setLongitude(dto.getLongitude());
        if (dto.getDefaultRadius() != null) {
            location.setDefaultRadius(dto.getDefaultRadius());
        }
        location.setDescription(dto.getDescription());
        return locationRepository.save(location);
    }

    @Transactional
    public void deleteLocation(Long id) {
        Location location = getLocationById(id);
        locationRepository.delete(location);
    }
}
