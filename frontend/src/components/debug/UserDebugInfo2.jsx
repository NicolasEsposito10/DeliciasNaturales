import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserDebugInfo = () => {
  const { user, isAuthenticated, isAdmin, isClient, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Forzar actualización cada segundo para detectar cambios
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = () => {
    console.log('🔄 Forzando cierre de sesión desde debug...');
    logout();
    // Forzar recarga de la página para limpiar todo
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Verificar localStorage directamente
  const localStorageUser = localStorage.getItem('user');
  const parsedLocalUser = localStorageUser ? JSON.parse(localStorageUser) : null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '10px',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '10px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace',
      border: '1px solid #333',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{ marginBottom: '8px', borderBottom: '1px solid #555', paddingBottom: '4px' }}>
        <strong>🐛 ESTADO DEL USUARIO #{refreshKey}</strong>
        <button 
          onClick={handleForceLogout}
          style={{
            marginLeft: '8px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '2px 6px',
            fontSize: '9px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      
      <div><strong>CONTEXT STATE:</strong></div>
      <div>👤 user object: {user ? '✅ EXISTS' : '❌ NULL'}</div>
      <div>🔐 isAuthenticated(): {isAuthenticated() ? '✅ TRUE' : '❌ FALSE'}</div>
      <div>🔑 isAdmin(): {isAdmin() ? '✅ TRUE' : '❌ FALSE'}</div>
      <div>👥 isClient(): {isClient() ? '✅ TRUE' : '❌ FALSE'}</div>
      
      <div style={{ marginTop: '6px', borderTop: '1px solid #555', paddingTop: '4px' }}>
        <div><strong>USER DATA:</strong></div>
        <div>📧 Email: <span style={{ color: '#90EE90' }}>{user?.email || 'NULL'}</span></div>
        <div>🏷️ Role: <span style={{ color: user?.role === 'admin' ? '#FFD700' : '#87CEEB' }}>{user?.role || 'NULL'}</span></div>
        <div>👋 Name: <span style={{ color: '#FFA07A' }}>{user?.name || user?.nombre || 'NULL'}</span></div>
      </div>

      <div style={{ marginTop: '6px', borderTop: '1px solid #555', paddingTop: '4px' }}>
        <div><strong>LOCALSTORAGE:</strong></div>
        <div>� localStorage user: {localStorageUser ? '✅ EXISTS' : '❌ NULL'}</div>
        {parsedLocalUser && (
          <>
            <div>📧 LS Email: <span style={{ color: '#90EE90' }}>{parsedLocalUser.email}</span></div>
            <div>🏷️ LS Role: <span style={{ color: '#FFD700' }}>{parsedLocalUser.role}</span></div>
          </>
        )}
      </div>

      <div style={{ marginTop: '6px', borderTop: '1px solid #555', paddingTop: '4px' }}>
        <div><strong>NAVBAR CHECK:</strong></div>
        <div>🕒 Debe mostrar ADMINISTRAR: {isAuthenticated() && isAdmin() ? '✅ SÍ' : '❌ NO'}</div>
        <div>📊 Cálculo: auth({isAuthenticated() ? 'T' : 'F'}) && admin({isAdmin() ? 'T' : 'F'}) = {isAuthenticated() && isAdmin() ? 'T' : 'F'}</div>
      </div>
    </div>
  );
};

export default UserDebugInfo;