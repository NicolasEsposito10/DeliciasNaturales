import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist debe ser usado dentro de WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Cargar wishlist cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      cargarWishlist();
    } else {
      // Limpiar wishlist cuando no está autenticado
      setWishlistItems([]);
    }
  }, [isAuthenticated, user]);

  const cargarWishlist = async () => {
    if (!isAuthenticated) {
      console.log('🔍 WishlistContext: Usuario no autenticado, saltando carga');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔍 WishlistContext: No hay token, saltando carga');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 WishlistContext: Cargando wishlist...');
      const response = await axios.get('/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ WishlistContext: Wishlist cargada exitosamente');
      setWishlistItems(response.data);
    } catch (error) {
      console.error('❌ WishlistContext: Error al cargar wishlist:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        setWishlistItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const agregarAWishlist = async (productoId) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar productos a tu wishlist');
    }

    const token = localStorage.getItem('token');

    try {
      const response = await axios.post('/api/wishlist', {
        producto_id: productoId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Recargar wishlist para obtener datos actualizados
      await cargarWishlist();
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        throw new Error('El producto ya está en tu wishlist');
      }
      throw new Error('Debes iniciar sesión para agregar producto a la lista de favoritos');
    }
  };

  const removerDeWishlist = async (productoId) => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`/api/wishlist/${productoId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Actualizar estado local inmediatamente
      setWishlistItems(prev => prev.filter(item => item.id !== productoId));
      
    } catch (error) {
      console.error('Error al remover de wishlist:', error);
      // Recargar en caso de error para mantener consistencia
      cargarWishlist();
      throw new Error('Error al remover producto de wishlist');
    }
  };

  const estaEnWishlist = (productoId) => {
    return wishlistItems.some(item => item.id === productoId);
  };

  const toggleWishlist = async (producto) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para usar la wishlist');
    }

    const enWishlist = estaEnWishlist(producto.id);
    
    if (enWishlist) {
      await removerDeWishlist(producto.id);
    } else {
      await agregarAWishlist(producto.id);
    }
  };

  const limpiarWishlist = () => {
    setWishlistItems([]);
  };

  const obtenerCount = () => {
    return wishlistItems.length;
  };

  const obtenerPreview = (limite = 10) => {
    return wishlistItems.slice(0, limite);
  };

  const value = {
    wishlistItems,
    loading,
    agregarAWishlist,
    removerDeWishlist,
    estaEnWishlist,
    toggleWishlist,
    limpiarWishlist,
    cargarWishlist,
    obtenerCount,
    obtenerPreview
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
