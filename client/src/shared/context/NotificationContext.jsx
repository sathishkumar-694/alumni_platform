import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '12px',
            background:
              notification.type === 'error'
                ? 'rgba(244, 63, 94, 0.95)'
                : notification.type === 'success'
                ? 'rgba(16, 185, 129, 0.95)'
                : 'rgba(6, 182, 212, 0.95)',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            fontWeight: 600,
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
