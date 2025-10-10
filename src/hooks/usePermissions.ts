import { useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

// Admin emails with full access
const ADMIN_EMAILS = ['gemdelle@bridyam.com', 'hunny@bridyam.com'];

export interface UserPermissions {
  // Check if user is an admin
  isAdmin: boolean;
  
  // Check if user can see all navigation items
  canSeeAllNavigation: boolean;
  
  // Check if user can edit a specific ranked username
  canEditRankedUsername: (username: string) => boolean;
  
  // Get list of ranked usernames the user can edit
  editableUsernames: string[];
}

export const usePermissions = (): UserPermissions => {
  const { user } = useAuthContext();

  // Use more specific dependencies to ensure re-calculation
  const userEmail = user?.email?.toLowerCase() || '';
  const rankedUsernames = user?.rankedUsernames || [];
  const rankedUsernamesKey = rankedUsernames.join(','); // Create a string key for dependency

  return useMemo(() => {
    if (!user) {
      return {
        isAdmin: false,
        canSeeAllNavigation: false,
        canEditRankedUsername: () => false,
        editableUsernames: [],
      };
    }

    const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

    return {
      isAdmin,
      canSeeAllNavigation: isAdmin,
      canEditRankedUsername: (username: string) => {
        // Admins can edit everything
        if (isAdmin) return true;
        
        // Non-admins can only edit their assigned usernames
        return rankedUsernames.includes(username);
      },
      editableUsernames: isAdmin ? [] : rankedUsernames, // Empty array for admins means "all"
    };
  }, [user, userEmail, rankedUsernamesKey]);
};

