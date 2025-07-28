import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface CursorContextType {
  selectedCursor: string | null;
  setSelectedCursor: (cursor: string | null) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (context === undefined) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};

interface CursorProviderProps {
  children: ReactNode;
}

export const CursorProvider: React.FC<CursorProviderProps> = ({ children }) => {
  const [selectedCursor, setSelectedCursorState] = useState<string | null>(() => {
    // Try to get cursor from localStorage on initialization
    return localStorage.getItem('selectedCursor');
  });

  const setSelectedCursor = (cursor: string | null) => {
    setSelectedCursorState(cursor);
    
    // Save to localStorage
    if (cursor) {
      localStorage.setItem('selectedCursor', cursor);
    } else {
      localStorage.removeItem('selectedCursor');
    }
    
    // Apply cursor class to body
    const body = document.body;
    
    // Remove all cursor classes
    body.classList.remove('cursor-1', 'cursor-2', 'cursor-3', 'cursor-4', 'cursor-default');
    
    // Remove all data attributes
    body.removeAttribute('data-cursor');
    
    // Add the selected cursor class
    if (cursor) {
      body.classList.add(cursor);
      body.setAttribute('data-cursor', cursor);
      console.log(`Applied cursor class: ${cursor}`); // Debug log
    } else {
      body.classList.add('cursor-default');
      console.log('Applied default cursor class'); // Debug log
    }
  };

  // Apply cursor on mount and when selectedCursor changes
  useEffect(() => {
    const body = document.body;
    body.classList.remove('cursor-1', 'cursor-2', 'cursor-3', 'cursor-4', 'cursor-default');
    body.removeAttribute('data-cursor');
    
    if (selectedCursor) {
      body.classList.add(selectedCursor);
      body.setAttribute('data-cursor', selectedCursor);
      console.log(`useEffect: Applied cursor class: ${selectedCursor}`); // Debug log
    } else {
      body.classList.add('cursor-default');
      console.log('useEffect: Applied default cursor class'); // Debug log
    }
  }, [selectedCursor]);

  return (
    <CursorContext.Provider value={{ selectedCursor, setSelectedCursor }}>
      {children}
    </CursorContext.Provider>
  );
}; 