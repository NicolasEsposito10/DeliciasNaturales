import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthContext - Inicializando...');
    // Verificar si hay un usuario logueado en localStorage
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      console.log('📦 localStorage user:', storedUser);
      console.log('📦 localStorage token:', storedToken ? 'existe' : 'no existe');
      
      // Solo considerar autenticado si AMBOS existen
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        console.log('✅ Usuario restaurado del localStorage:', userData);
        setUser(userData);
      } else {
        console.log('❌ No hay usuario completo en localStorage (falta user o token)');
        // Limpiar cualquier dato incompleto
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('💥 Error loading user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
    console.log('✅ AuthContext inicializado');
  }, []);

  const login = (userData, token = null) => {
    console.log('🚪 Login - userData recibida:', userData);
    console.log('🚪 Login - token parámetro recibido:', token ? 'existe' : 'no existe');
    
    // Verificar si el token viene en userData o como parámetro separado
    let finalToken = token;
    if (!finalToken && userData) {
      // Buscar el token en diferentes posibles propiedades
      finalToken = userData.token || userData.access_token || userData.authToken;
      console.log('🔍 Login - Buscando token en userData:', finalToken ? 'encontrado' : 'no encontrado');
    }
    
    // También verificar si hay un token ya en localStorage que podamos usar
    if (!finalToken) {
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        finalToken = existingToken;
        console.log('🔍 Login - Usando token existente de localStorage');
      }
    }
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Si tenemos token, guardarlo
    if (finalToken) {
      localStorage.setItem('token', finalToken);
      console.log('✅ Login - Usuario y token guardados en localStorage y state');
      console.log('📱 Token guardado (primeros 20 chars):', finalToken.substring(0, 20));
    } else {
      console.log('⚠️ Login - Usuario guardado pero NO hay token disponible');
    }
    
    // Verificar inmediatamente lo que quedó guardado
    console.log('🔍 Verificación inmediata localStorage:');
    console.log('  - user:', localStorage.getItem('user') ? 'guardado' : 'NO guardado');
    console.log('  - token:', localStorage.getItem('token') ? 'guardado' : 'NO guardado');
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    
    // Limpiar carrito del usuario actual antes de cerrar sesión
    const userId = user?.id;
    if (userId) {
      const carritoKey = `carrito_${userId}`;
      localStorage.removeItem(carritoKey);
      console.log(`🗑️ Carrito del usuario ${userId} eliminado`);
    }
    
    setUser(null);
    localStorage.removeItem('user');
    // Limpiar cualquier otro dato de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    console.log('✅ Sesión cerrada correctamente');
  };

  const isAuthenticated = () => {
    const hasUser = user !== null;
    const hasToken = localStorage.getItem('token') !== null;
    const result = hasUser && hasToken;
    console.log('🔍 isAuthenticated check:', { 
      hasUser, 
      hasToken, 
      result,
      userEmail: user?.email 
    });
    return result;
  };

  const isAdmin = () => {
    const result = user && user.role === 'admin';
    console.log('🔍 isAdmin check:', { user: user?.email, role: user?.role, isAdmin: result });
    return result;
  };

  const isClient = () => {
    const result = user && user.role === 'client';
    console.log('🔍 isClient check:', { user: user?.email, role: user?.role, isClient: result });
    return result;
  };

  const getToken = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 getToken llamado, token disponible:', token ? 'SÍ' : 'NO');
    return token;
  };

  const updateUser = (updatedUserData) => {
    console.log('🔄 Actualizando datos del usuario:', updatedUserData);
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    console.log('✅ Usuario actualizado en context y localStorage');
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    isClient,
    getToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};