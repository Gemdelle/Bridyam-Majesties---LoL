import { useState, useEffect } from 'react';
import { usePetContext } from '../contexts/PetContext';

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

export const useNotifications = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { selectedPet } = usePetContext();

  useEffect(() => {
    const checkNotification = async () => {
      try {
        // Import notification data
        const notificationData = await import('../data/notifications.json');
        const currentNotification = notificationData.currentNotification;
        
        if (!currentNotification.active) {
          return;
        }

        // Check if user has already seen this notification
        const seenNotifications = localStorage.getItem('seenNotifications');
        const seenIds = seenNotifications ? JSON.parse(seenNotifications) : [];
        
        if (!seenIds.includes(currentNotification.id)) {
          setNotification(currentNotification);
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error loading notification:', error);
      }
    };

    checkNotification();
  }, []);

  const markAsSeen = () => {
    if (!notification) return;

    const seenNotifications = localStorage.getItem('seenNotifications');
    const seenIds = seenNotifications ? JSON.parse(seenNotifications) : [];
    
    if (!seenIds.includes(notification.id)) {
      seenIds.push(notification.id);
      localStorage.setItem('seenNotifications', JSON.stringify(seenIds));
    }

    setShowModal(false);
  };

  const getCurrentPetNumber = (): number => {
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('user_data');
      if (!userData) return 1;

      const user = JSON.parse(userData);
      const currentPetId = user.currentPet?.petId || user.currentPet;

      // Map pet IDs to numbers
      const petIdMap: { [key: string]: number } = {
        '3a64431d-f33a-4586-9959-242d3e7ff681': 1, // pet-1
        'adb9781a-e11e-4339-a8a5-455dd8b6cbd5': 2, // pet-2
        '8412e3d5-2976-4c58-ba5a-453dd2154fef': 3, // pet-3
        'f405373c-f852-4a4e-beba-b89f8b7f1fc2': 4, // pet-4
      };

      return petIdMap[currentPetId] || 1;
    } catch (error) {
      console.error('Error getting current pet from localStorage:', error);
      return 1;
    }
  };

  return {
    notification,
    showModal,
    markAsSeen,
    currentPetNumber: getCurrentPetNumber()
  };
};
