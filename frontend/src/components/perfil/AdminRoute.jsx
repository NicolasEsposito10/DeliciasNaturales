import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  useEffect(() => {
    // Si el usuario no es admin, redirigir inmediatamente
    if (!loading && isAuthenticated() && !isAdmin()) {
      console.log('🚫 Acceso denegado - Redirigiendo usuario:', user?.role);
      window.location.replace('/inicio');
    }
  }, [loading, isAuthenticated, isAdmin, user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-muted">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Usuario no autenticado - redirigir a login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado pero no es admin - redirigir inmediatamente a inicio
  if (!isAdmin()) {
    // Usuario logueado pero no es admin - mostrar mensaje y redirigir
    console.log('Acceso denegado - Usuario:', user?.role);
    
    // Mostrar mensaje por 2 segundos antes de redirigir
    setTimeout(() => {
      window.location.href = '/inicio';
    }, 2000);
    
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning text-center">
              <h4>🚫 Acceso Restringido</h4>
              <p className="mb-3">
                Esta sección es solo para administradores.
              </p>
              <p className="mb-3">
                <strong>Tu rol actual:</strong> {user?.role === 'client' ? 'Cliente' : user?.role}
              </p>
              <p className="text-muted">
                Serás redirigido al inicio en unos segundos...
              </p>
              <div className="mt-3">
                <a href="/inicio" className="btn btn-primary">
                  Ir al Inicio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;