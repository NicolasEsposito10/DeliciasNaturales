import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Login.css';

// Códigos de países con sus códigos telefónicos
const PAISES_TELEFONICOS = [
  { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷' },
  { codigo: '+56', pais: 'Chile', bandera: '🇨🇱' },
  { codigo: '+57', pais: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+52', pais: 'México', bandera: '🇲🇽' },
  { codigo: '+51', pais: 'Perú', bandera: '🇵🇪' },
  { codigo: '+598', pais: 'Uruguay', bandera: '🇺🇾' },
  { codigo: '+58', pais: 'Venezuela', bandera: '🇻🇪' },
  { codigo: '+1', pais: 'Estados Unidos', bandera: '🇺🇸' },
  { codigo: '+34', pais: 'España', bandera: '🇪🇸' },
];

function Registro() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    codigoPais: '+54',
    telefono: ''
  });
  
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{8,15}$/.test(formData.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'El teléfono debe contener entre 8 y 15 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Preparar datos para enviar
      const userData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telefono_completo: `${formData.codigoPais}${formData.telefono.replace(/\s/g, '')}`,
        codigo_pais: formData.codigoPais,
        telefono: formData.telefono.replace(/\s/g, ''),
        role: 'client' // Por defecto los nuevos usuarios son clientes
      };

      // Llamada a la API para registrar usuario
      const response = await fetch('http://localhost:5000/api/usuarios/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        // Registro exitoso, loguear automáticamente
        const { password, ...userWithoutPassword } = result.usuario;
        login(userWithoutPassword);
        
        // Verificar si hay carrito pendiente para redirigir al carrito
        if (tieneCarritoPendiente) {
          alert('¡Registro exitoso y bienvenido!\nTus productos del carrito han sido guardados en tu nueva cuenta.');
          console.log('🛒 Redirigiendo al carrito después del registro con carrito pendiente');
          navigate('/carrito');
        } else {
          alert('Registro exitoso. Bienvenido!');
          navigate('/inicio');
        }
      } else {
        // Error en el registro
        if (result.message) {
          setErrors({ general: result.message });
        } else {
          setErrors({ general: 'Error al registrar usuario' });
        }
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setErrors({ general: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <div className="text-center mb-4">
          <img 
            src="/logos/DN_logo_green_text.svg" 
            alt="Delicias Naturales Logo" 
            height="60" 
            className="mb-3"
          />
          <h2 className="registro-title">CREAR CUENTA</h2>
          <p className="registro-subtitle">Únete a nuestra comunidad</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger registro-alert" role="alert">
            {errors.general}
          </div>
        )}

        {tieneCarritoPendiente && (
          <div className="alert alert-info registro-alert" role="alert">
            <i className="bi bi-cart-fill me-2"></i>
            <strong>¡Tienes productos en tu carrito!</strong><br />
            Crea tu cuenta para continuar con tu compra. Tus productos no se perderán.
          </div>
        )}

        <form onSubmit={handleSubmit} className="registro-form">
          {/* Nombre y Apellido */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="nombre" className="registro-label">NOMBRE</label>
              <input
                type="text"
                className={`registro-input ${errors.nombre ? 'is-invalid' : ''}`}
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="apellido" className="registro-label">APELLIDO</label>
              <input
                type="text"
                className={`registro-input ${errors.apellido ? 'is-invalid' : ''}`}
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Tu apellido"
                required
              />
              {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
            </div>
          </div>

          {/* Email */}
          <div className="registro-form-group">
            <label htmlFor="email" className="registro-label">CORREO ELECTRÓNICO</label>
            <input
              type="email"
              className={`registro-input ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingrese su correo"
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Teléfono */}
          <div className="registro-form-group">
            <label htmlFor="telefono" className="registro-label">TELÉFONO</label>
            <div className="phone-input-group">
              <select 
                className="registro-select" 
                name="codigoPais"
                value={formData.codigoPais}
                onChange={handleChange}
              >
                {PAISES_TELEFONICOS.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>
                    {pais.bandera} {pais.codigo}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className={`registro-input phone-input ${errors.telefono ? 'is-invalid' : ''}`}
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Número de teléfono"
                required
              />
              {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
            </div>
            <small className="form-text text-muted mt-1">
              Solo números, sin espacios ni guiones
            </small>
          </div>

          {/* Contraseñas */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label htmlFor="password" className="registro-label">CONTRASEÑA</label>
              <div className="password-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`registro-input password-input ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
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
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="confirmPassword" className="registro-label">CONFIRMAR CONTRASEÑA</label>
              <div className="password-input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`registro-input password-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <button 
            type="submit" 
            className="registro-btn w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="registro-footer">
          <span>¿Ya tienes cuenta? </span>
          <Link to="/login" className="registro-link">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Registro;
