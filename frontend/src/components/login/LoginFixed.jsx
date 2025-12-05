import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tieneCarritoPendiente, setTieneCarritoPendiente] = useState(false);

  // Verificar si hay un carrito pendiente al cargar el componente
  useEffect(() => {
    const carritoPendiente = localStorage.getItem('carrito_pendiente_login');
    if (carritoPendiente) {
      try {
        const items = JSON.parse(carritoPendiente);
        setTieneCarritoPendiente(items.length > 0);
      } catch (error) {
        console.error('Error verificando carrito pendiente:', error);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('🎯 Login exitoso - Respuesta completa:', result);
        console.log('🔑 Token recibido:', result.token ? 'SÍ' : 'NO');
        // Guardar token y usuario según 'Recordarme'
        if (formData.rememberMe) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('usuario', JSON.stringify(result.usuario));
        } else {
          sessionStorage.setItem('token', result.token);
          sessionStorage.setItem('usuario', JSON.stringify(result.usuario));
        }
        // CORREGIR: Pasar AMBOS parámetros al AuthContext
        login(result.usuario, result.token);
        
        // Verificar si hay carrito pendiente para redirigir al carrito
        if (tieneCarritoPendiente) {
          console.log('🛒 Redirigiendo al carrito después del login con carrito pendiente');
          navigate('/carrito');
        } else {
          navigate('/inicio');
        }
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4">
          <img 
            src="/logos/DN_logo_green_text.svg" 
            alt="Delicias Naturales Logo" 
            height="60" 
            className="mb-3"
          />
          <h2 className="login-title">INICIAR SESIÓN</h2>
          <p className="login-subtitle">Accede a tu cuenta</p>
        </div>

        {error && (
          <div className="alert alert-danger login-alert" role="alert">
            {error}
          </div>
        )}

        {tieneCarritoPendiente && (
          <div className="alert alert-info login-alert" role="alert">
            <i className="bi bi-cart-fill me-2"></i>
            <strong>¡Tienes productos en tu carrito!</strong><br />
            Inicia sesión para continuar con tu compra. Tus productos no se perderán.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">CORREO ELECTRÓNICO</label>
            <input
              type="email"
              className="login-input"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingrese su correo"
              required
            />
          </div>
          
          <div className="login-form-group">
            <label htmlFor="password" className="login-label">CONTRASEÑA</label>
            <div className="password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="login-input password-input"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                    <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-12-12 .708-.708 12 12z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Recordarme
            </label>
          </div>

          <button 
            type="submit" 
            className="login-btn w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <div className="mb-2">
            <span>¿No tienes cuenta? </span>
            <Link to="/register" className="login-link">Regístrate aquí</Link>
          </div>
          <div>
            <Link to="/recuperar-contraseña" className="login-link">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;