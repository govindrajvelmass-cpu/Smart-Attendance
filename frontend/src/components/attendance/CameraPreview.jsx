import React from 'react';
import { Camera, CameraOff, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

export default function CameraPreview({ onCapture }) {
  const {
    videoRef,
    isStreaming,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    captureImage,
    resetCapture
  } = useCamera();

  const handleCapture = () => {
    const imgData = captureImage();
    if (onCapture) {
      onCapture(imgData);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <div className="card-header" style={{ justifyContent: 'center', flexDirection: 'column' }}>
        <h4 className="card-title flex items-center gap-2">
          <Camera size={20} color="var(--color-primary)" />
          Face Recognition Scanner (Future Feature)
        </h4>
        <span className="card-description">
          Camera stream structure ready for biometric identity verification
        </span>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      <div className="camera-container" style={{ minHeight: 260, position: 'relative' }}>
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured verification face"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
        )}

        {!isStreaming && !capturedImage && (
          <div style={{ color: 'var(--color-text-subtle)', padding: '2rem' }}>
            <CameraOff size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.875rem' }}>Camera is currently turned off</p>
          </div>
        )}

        {isStreaming && !capturedImage && (
          <>
            <div className="camera-scan-frame" />
            <div className="camera-scan-line" />
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                backdropFilter: 'blur(2px)'
              }}
            >
              Align your face within the frame
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
        {!isStreaming && !capturedImage ? (
          <button type="button" onClick={startCamera} className="btn btn-outline btn-sm">
            <Camera size={16} />
            <span>Turn On Camera</span>
          </button>
        ) : null}

        {isStreaming && !capturedImage ? (
          <>
            <button type="button" onClick={handleCapture} className="btn btn-primary btn-sm">
              <Sparkles size={16} />
              <span>Capture Photo</span>
            </button>
            <button type="button" onClick={stopCamera} className="btn btn-outline btn-sm">
              <CameraOff size={16} />
              <span>Turn Off</span>
            </button>
          </>
        ) : null}

        {capturedImage ? (
          <button
            type="button"
            onClick={() => {
              resetCapture();
              startCamera();
            }}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={16} />
            <span>Retake Photo</span>
          </button>
        ) : null}
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          padding: '0.65rem 0.85rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          textAlign: 'left'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Notice: </span>
        Biometric verification pipeline UI is initialized. Camera frame captures are simulated for testing until the backend facial recognition model is connected.
      </div>
    </div>
  );
}
