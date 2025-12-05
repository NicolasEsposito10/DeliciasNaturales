import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/PerfilNuevo.css';

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

// Función para formatear fecha de nacimiento evitando problemas de zona horaria
const formatearFechaNacimiento = (fechaString) => {
  if (!fechaString) return 'No especificada';
  
  try {
    // Si la fecha viene en formato ISO (YYYY-MM-DD), procesarla como fecha local
    if (fechaString.includes('-') && fechaString.length === 10) {
      const [año, mes, día] = fechaString.split('-');
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(día)); // mes - 1 porque los meses en JS van de 0-11
      return fecha.toLocaleDateString('es-ES');
    }
    
    // Si viene en formato completo ISO (con hora), extraer solo la fecha
    if (fechaString.includes('T')) {
      const fechaSolo = fechaString.split('T')[0];
      const [año, mes, día] = fechaSolo.split('-');
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(día));
      return fecha.toLocaleDateString('es-ES');
    }
    
    // Para otros formatos, usar el método estándar como último recurso
    return new Date(fechaString).toLocaleDateString('es-ES');
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return fechaString; // Devolver la fecha original si hay error
  }
};

const Perfil = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    codigo_pais: user?.codigo_pais || '+54',
    telefono: user?.telefono || '',
    fecha_nacimiento: user?.fecha_nacimiento || '',
    direccion: user?.direccion || '',
    ciudad: user?.ciudad || '',
    codigo_postal: user?.codigo_postal || '',
    password: '',
    confirmPassword: ''
  });

  // Cargar datos del usuario desde el backend
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!user?.id || dataLoaded) return;

      try {
        console.log('Cargando datos del usuario desde el backend...');
        const response = await fetch(`http://localhost:5000/api/usuarios/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.usuario) {
            const userData = result.usuario;
            
            setFormData({
              nombre: userData.nombre || '',
              apellido: userData.apellido || '',
              email: userData.email || '',
              codigo_pais: userData.codigo_pais || '+54',
              telefono: userData.telefono || '',
              fecha_nacimiento: userData.fecha_nacimiento || '',
              direccion: userData.direccion || '',
              ciudad: userData.ciudad || '',
              codigo_postal: userData.codigo_postal || '',
              password: '',
              confirmPassword: ''
            });
            
            // Actualizar el contexto del usuario con los datos del backend
            updateUser(userData);
            
            setDataLoaded(true);
            console.log('Datos cargados correctamente:', userData);
          }
        } else {
          console.error('Error cargando datos del usuario:', response.status);
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }
    };

    // Solo cargar una vez cuando el componente se monta y el usuario está disponible
    cargarDatosUsuario();
  }, [user?.id, dataLoaded]); // Se ejecuta cuando cambia el ID del usuario pero solo si no se han cargado datos

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

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{8,15}$/.test(formData.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'El teléfono debe contener entre 8 y 15 dígitos';
    }

    // Validar contraseña solo si se está cambiando
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const userData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        codigo_pais: formData.codigo_pais,
        telefono: formData.telefono.replace(/\s/g, ''),
        telefono_completo: `${formData.codigo_pais}${formData.telefono.replace(/\s/g, '')}`,
        fecha_nacimiento: formData.fecha_nacimiento,
        direccion: formData.direccion.trim(),
        ciudad: formData.ciudad.trim(),
        codigo_postal: formData.codigo_postal.trim()
      };

      // Solo incluir contraseña si se está cambiando
      if (formData.password) {
        userData.password = formData.password;
      }

      console.log('Enviando datos:', userData); // Para debugging

      const response = await fetch(`http://localhost:5000/api/usuarios/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });

      console.log('Response status:', response.status); // Para debugging

      const result = await response.json();
      console.log('Response data:', result); // Para debugging

      if (response.ok && result.success) {
        // Actualizar el contexto del usuario
        updateUser(result.usuario);
        setIsEditing(false);
        setErrors({});
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        console.log('Perfil actualizado exitosamente');
        alert('Perfil actualizado exitosamente');
      } else {
        console.error('Error del servidor:', result);
        setErrors({ general: result.message || result.error || 'Error al actualizar el perfil' });
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setErrors({ general: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      codigo_pais: user?.codigo_pais || '+54',
      telefono: user?.telefono || '',
      fecha_nacimiento: user?.fecha_nacimiento || '',
      direccion: user?.direccion || '',
      ciudad: user?.ciudad || '',
      codigo_postal: user?.codigo_postal || '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleLogout = () => {
    console.log('🚪 Cerrando sesión desde perfil...');
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="perfil-container">
        <div className="perfil-card">
          <div className="alert alert-warning">
            No hay información de usuario disponible.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <div className="perfil-header">
          <div className="perfil-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className="perfil-info">
            <h1>Mi Perfil</h1>
            <p>Gestiona tu información personal</p>
          </div>
          {!isEditing && (
            <button 
              className="btn-edit-profile"
              onClick={() => setIsEditing(true)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Editar Perfil
            </button>
          )}
        </div>

        {errors.general && (
          <div className="error-alert">
            {errors.general}
          </div>
        )}

        <div className="perfil-content">
          {!isEditing ? (
            // Vista de solo lectura
            <div className="perfil-view">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <div className="form-value">{formData.nombre || 'No especificado'}</div>
                </div>

                <div className="form-group">
                  <label>Apellido</label>
                  <div className="form-value">{formData.apellido || 'No especificado'}</div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <div className="form-value">{formData.email || 'No especificado'}</div>
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <div className="form-value">
                    {formData.telefono ? 
                      `${formData.codigo_pais} ${formData.telefono}` : 
                      'No especificado'
                    }
                  </div>
                </div>

                <div className="form-group">
                  <label>Fecha de Nacimiento</label>
                  <div className="form-value">
                    {formData.fecha_nacimiento ? 
                      formatearFechaNacimiento(formData.fecha_nacimiento) : 
                      'No especificada'
                    }
                  </div>
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <div className="form-value">{formData.direccion || 'No especificada'}</div>
                </div>

                <div className="form-group">
                  <label>Ciudad</label>
                  <div className="form-value">{formData.ciudad || 'No especificada'}</div>
                </div>

                <div className="form-group">
                  <label>Código Postal</label>
                  <div className="form-value">{formData.codigo_postal || 'No especificado'}</div>
                </div>
              </div>
            </div>
          ) : (
            // Vista de edición
            <div className="perfil-edit">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={errors.nombre ? 'error' : ''}
                    placeholder="Ingresa tu nombre"
                  />
                  {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="apellido">Apellido *</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className={errors.apellido ? 'error' : ''}
                    placeholder="Ingresa tu apellido"
                  />
                  {errors.apellido && <span className="error-text">{errors.apellido}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <div className="phone-input">
                    <select
                      name="codigo_pais"
                      value={formData.codigo_pais}
                      onChange={handleChange}
                      className="country-select"
                    >
                      {PAISES_TELEFONICOS.map(pais => (
                        <option key={pais.codigo} value={pais.codigo}>
                          {pais.bandera} {pais.codigo}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className={errors.telefono ? 'error' : ''}
                      placeholder="1234567890"
                    />
                  </div>
                  {errors.telefono && <span className="error-text">{errors.telefono}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Calle, número, piso, etc."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ciudad">Ciudad</label>
                  <input
                    type="text"
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    placeholder="Tu ciudad"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="codigo_postal">Código Postal</label>
                  <input
                    type="text"
                    id="codigo_postal"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleChange}
                    placeholder="1234"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Nueva Contraseña (opcional)</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? 'error' : ''}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Repite la contraseña"
                    disabled={!formData.password}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="perfil-actions">
          <button 
            className="btn-logout"
            onClick={handleLogout}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Cerrar Sesión
          </button>
          
          <button 
            className="btn-home"
            onClick={() => navigate('/inicio')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Ir al Inicio
          </button>
          
          {user.role === 'admin' && (
            <button 
              className="btn-admin"
              onClick={() => navigate('/administrar/')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              Administrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;