import React, { useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateDistanceMeters, formatDistance } from '../../utils/geo';

export default function LocationChecker({
  targetLatitude,
  targetLongitude,
  allowedRadius = 50,
  location,
  error,
  loading,
  onGetLocation
}) {
  const currentDistance =
    location && targetLatitude != null && targetLongitude != null
      ? calculateDistanceMeters(
          location.latitude,
          location.longitude,
          targetLatitude,
          targetLongitude
        )
      : null;

  const isWithinRadius = currentDistance !== null && currentDistance <= allowedRadius;

  return (
    <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="card-header">
        <h4 className="card-title flex items-center gap-2">
          <MapPin size={20} color="var(--color-primary)" />
          GPS Geofence Verification
        </h4>
        <span className="badge badge-active">Active Geofence</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Classroom Coordinates:</span>
          <span style={{ fontWeight: 600 }}>
            {targetLatitude ? `${targetLatitude.toFixed(6)}, ${targetLongitude.toFixed(6)}` : 'Target unassigned'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Required Radius:</span>
          <span style={{ fontWeight: 600 }}>{allowedRadius} meters</span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

        {location ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Your Coordinates:</span>
              <span style={{ fontWeight: 600 }}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </span>
            </div>

            {location.accuracy != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>GPS Accuracy:</span>
                <span>±{location.accuracy.toFixed(1)} m</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Distance to Classroom:</span>
              <span style={{ fontWeight: 700, color: isWithinRadius ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {formatDistance(currentDistance)}
              </span>
            </div>

            {isWithinRadius ? (
              <div className="alert alert-success" style={{ marginTop: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>Location Verified!</strong> You are inside the classroom attendance boundary ({formatDistance(currentDistance)} away).
                </div>
              </div>
            ) : (
              <div className="alert alert-danger" style={{ marginTop: '0.5rem' }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>Outside Boundary!</strong> You must be within {allowedRadius}m of the classroom. Currently {formatDistance(currentDistance)} away.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Please acquire your GPS location to verify physical classroom presence.
            </p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <div>{error}</div>
          </div>
        )}

        <button
          type="button"
          onClick={onGetLocation}
          disabled={loading}
          className="btn btn-outline"
          style={{ width: '100%' }}
        >
          <Navigation size={18} />
          <span>{loading ? 'Locating Device...' : location ? 'Refresh GPS Coordinates' : 'Get My Location'}</span>
        </button>
      </div>
    </div>
  );
}
