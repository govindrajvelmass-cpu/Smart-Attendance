package com.smartattendance.backend;

import com.smartattendance.backend.util.GeoUtils;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class GeoUtilsTest {

    @Test
    void testHaversineDistanceCalculation() {
        // Point 1: Classroom at (12.9715987, 77.5945627)
        double classLat = 12.9715987;
        double classLon = 77.5945627;

        // Point 2: Student inside classroom (approx 5 meters away)
        double studentInsideLat = 12.9716300;
        double studentInsideLon = 77.5945800;
        double distanceInside = GeoUtils.calculateDistanceMeters(classLat, classLon, studentInsideLat, studentInsideLon);
        assertTrue(distanceInside < 10.0, "Student should be within 10 meters");

        // Point 3: Student outside campus (approx 1.5 km away)
        double studentFarLat = 12.9800000;
        double studentFarLon = 77.6000000;
        double distanceFar = GeoUtils.calculateDistanceMeters(classLat, classLon, studentFarLat, studentFarLon);
        assertTrue(distanceFar > 500.0, "Student should be more than 500 meters away");
    }

    @Test
    void testCoordinateValidation() {
        assertTrue(GeoUtils.isValidCoordinate(12.9716, 77.5946));
        assertTrue(GeoUtils.isValidCoordinate(0.0, 0.0));
        assertTrue(GeoUtils.isValidCoordinate(-90.0, 180.0));

        assertFalse(GeoUtils.isValidCoordinate(null, 77.0));
        assertFalse(GeoUtils.isValidCoordinate(12.0, null));
        assertFalse(GeoUtils.isValidCoordinate(95.0, 50.0));
        assertFalse(GeoUtils.isValidCoordinate(12.0, -190.0));
    }
}
