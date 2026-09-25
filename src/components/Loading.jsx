import React from 'react';

export default function Loading({ text = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="fullscreen-loader" role="status" aria-live="polite">
        <div className="spinner-orbit">
          <div className="spinner-core"></div>
        </div>
        <p className="loader-text">{text}</p>
      </div>
    );
  }

  return (
    <div className="inline-loader" role="status" aria-live="polite">
      <div className="spinner-sm"></div>
      {text && <span className="loader-text-sm">{text}</span>}
    </div>
  );
}
