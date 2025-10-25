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

  const frameImage = `/images/frames/news-frame-${currentPet}.png`;
  const petImage = `/images/pets/pet-${currentPet}-1.png`;

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

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-content">
          <div className="notification-frame">
            <img 
              src={frameImage} 
              alt="Notification Frame" 
              className="frame-image"
            />
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
                      <span>{point}</span>
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
    </div>
  );
};
