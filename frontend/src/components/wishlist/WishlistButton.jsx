import React, { useState } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const WishlistButton = ({ producto, className = "", style = {} }) => {
  const { estaEnWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const enWishlist = estaEnWishlist(producto.id);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      mostrarToast('Debes iniciar sesión para usar la wishlist', 'warning');
      return;
    }

    setLoading(true);
    try {
      await toggleWishlist(producto);
      
      if (enWishlist) {
        mostrarToast('Removido de tu lista de deseos', 'info');
      } else {
        mostrarToast('Agregado a tu lista de deseos', 'success');
      }
    } catch (error) {
      mostrarToast(error.message || 'Error al actualizar wishlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = (mensaje, tipo) => {
    setToastMessage(mensaje);
    setShowToast(true);
    
    // Auto ocultar después de 3 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`btn btn-outline-danger position-relative ${className}`}
        style={{
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          ...style
        }}
        title={enWishlist ? 'Remover de wishlist' : 'Agregar a wishlist'}
      >
        {loading ? (
          <div className="spinner-border spinner-border-sm text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        ) : (
          <i 
            className={`bi ${enWishlist ? 'bi-heart-fill' : 'bi-heart'} text-danger`}
            style={{ fontSize: '1.2rem' }}
          ></i>
        )}
      </button>

      {/* Toast notification */}
      {showToast && (
        <div 
          className="position-fixed top-0 end-0 p-3" 
          style={{ zIndex: 9999 }}
        >
          <div 
            className={`alert ${
              toastMessage.includes('Agregado') ? 'alert-success' : 
              toastMessage.includes('Removido') ? 'alert-info' : 
              'alert-warning'
            } alert-dismissible fade show`}
            role="alert"
          >
            <i className={`bi ${
              toastMessage.includes('Agregado') ? 'bi-heart-fill' : 
              toastMessage.includes('Removido') ? 'bi-heart' : 
              'bi-exclamation-triangle'
            } me-2`}></i>
            {toastMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowToast(false)}
            ></button>
          </div>
        </div>
      )}
    </>
  );
};

export default WishlistButton;
