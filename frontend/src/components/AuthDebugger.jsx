import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const AuthDebugger = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthStatus({
          autenticado: false,
          error: 'No hay token almacenado en localStorage'
        });
        setLoading(false);
        return;
      }
      
      // Verificar con el backend
      const response = await axios.get('/api/debug/auth', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAuthStatus(response.data);
    } catch (err) {
      setError(err.response?.data || { error: err.message });
      setAuthStatus({
        autenticado: false,
        error: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h4>Depurador de Autenticación</h4>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <p>Verificando estado de autenticación...</p>
          ) : (
            <>
              <h5>Estado de autenticación:</h5>
              {authStatus?.autenticado ? (
                <Alert variant="success">
                  <strong>Autenticado</strong>
                  <hr />
                  <p>Usuario: {authStatus.datos_usuario.email}</p>
                  <p>Rol: {authStatus.datos_usuario.role}</p>
                  <p>Expiración: {authStatus.expiracion}</p>
                  <p>Tiempo restante: {Math.floor(authStatus.tiempo_restante_segundos / 60)} minutos</p>
                </Alert>
              ) : (
                <Alert variant="danger">
                  <strong>No autenticado</strong>
                  <hr />
                  <p>Error: {authStatus?.error || "Desconocido"}</p>
                </Alert>
              )}
              
              <h5 className="mt-3">Token en localStorage:</h5>
              <pre className="bg-light p-2">
                {localStorage.getItem('token') || 'No hay token almacenado'}
              </pre>
              
              <Button 
                variant="primary" 
                onClick={checkAuth}
                className="mt-3"
              >
                Verificar autenticación
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuthDebugger;
