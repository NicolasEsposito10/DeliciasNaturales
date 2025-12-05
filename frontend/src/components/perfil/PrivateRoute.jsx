import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('🔒 PrivateRoute - Verificando acceso:', {
    loading,
    isAuthenticated: isAuthenticated(),
    token: localStorage.getItem('token') ? 'existe' : 'no existe'
  });

  // Mostrar loading mientras se inicializa la autenticación
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated()) {
    console.log('❌ PrivateRoute - No autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ PrivateRoute - Acceso autorizado');
  return children;
}

export default PrivateRoute;
