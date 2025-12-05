/**
 * Utilidades para manejo de autenticación
 */

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - true si está autenticado, false en caso contrario
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!token || !user) {
    return false;
  }
  
  // Opcionalmente puedes verificar si el token ha expirado
  // si almacenas la fecha de expiración
  const expiresAt = localStorage.getItem('expiresAt');
  if (expiresAt && new Date(expiresAt) < new Date()) {
    // Token expirado, limpiar storage
    logout();
    return false;
  }
  
  return true;
};

/**
 * Cierra la sesión del usuario eliminando datos del localStorage
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
};

/**
 * Guarda los datos de autenticación
 * @param {object} data - Datos de autenticación (token, usuario, etc)
 */
export const setAuthData = (data) => {
  const { token, user, expiresIn } = data;
  
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Calcular fecha de expiración si existe expiresIn (en segundos)
  if (expiresIn) {
    const expiresAt = new Date(new Date().getTime() + expiresIn * 1000);
    localStorage.setItem('expiresAt', expiresAt.toISOString());
  }
};

/**
 * Obtiene el token de autenticación
 * @returns {string|null} - Token o null si no está autenticado
 */
export const getAuthToken = () => {
  return isAuthenticated() ? localStorage.getItem('authToken') : null;
};

/**
 * Obtiene la información del usuario autenticado
 * @returns {object|null} - Datos del usuario o null si no está autenticado
 */
export const getAuthUser = () => {
  return isAuthenticated() ? JSON.parse(localStorage.getItem('user')) : null;
};
