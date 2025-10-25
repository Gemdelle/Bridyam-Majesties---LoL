import React from 'react';
import './NotificationModal.scss';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  bulletPoints?: string[];
  closing?: string;
  showButton: boolean;
  buttonText: string;
  active: boolean;
}

interface NotificationModalProps {
  notification: NotificationData;
  currentPet: number;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  currentPet,
  onClose
}) => {
  if (!notification.active) return null;

  // Get username from localStorage
  const getUsername = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.username || user.name || 'Usuario';
      }
      return 'Usuario';
    } catch {
      return 'Usuario';
    }
  };

  const username = getUsername();
  const title = notification.title.replace('{username}', username);
  const petImage = `/images/pets/pet-${currentPet}-1.png`;

  // Set CSS custom property for dynamic frame
  const frameStyle = {
    '--frame-image': `url('/images/frames/news-frame-${currentPet}.png')`
  } as React.CSSProperties;

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>

        {/* Corazones flotantes */}
        <div className="floating-hearts">
          <img src="/images/icons/love-icon-1.png" alt="heart" className="heart heart-left" />
          <img src="/images/icons/love-icon-2.png" alt="heart" className="heart heart-right" />
          <img src="/images/icons/love-icon-3.png" alt="heart" className="heart heart-center" />
        </div>

        <div className="notification-frame" style={frameStyle}>
          <img
            src={petImage}
            alt="Pet"
            className="pet-image"
          />
          <div className="notification-text">
            <h2 className="notification-title">{title}</h2>
            <p className="notification-message">{notification.message}</p>

            {notification.bulletPoints && notification.bulletPoints.length > 0 && (
              <ul className="notification-bullets">
                {notification.bulletPoints.map((point, index) => (
                  <li key={index} className="bullet-item">
                    <img
                      src="/images/bullets/bullet-right.png"
                      alt="Bullet"
                      className="bullet-icon"
                    />
                    <span className="bullet-text">{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {notification.closing && (
              <p className="notification-closing">{notification.closing}</p>
            )}

            {notification.showButton && (
              <button
                className="notification-button"
                onClick={onClose}
              >
                {notification.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
