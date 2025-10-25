import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationModal } from '../NotificationModal';

interface NotificationWrapperProps {
  children: React.ReactNode;
}

export const NotificationWrapper: React.FC<NotificationWrapperProps> = ({ children }) => {
  const { notification, showModal, markAsSeen, currentPetNumber } = useNotifications();

  return (
    <>
      {children}
      {showModal && notification && (
        <NotificationModal
          notification={notification}
          currentPet={currentPetNumber}
          onClose={markAsSeen}
        />
      )}
    </>
  );
};
