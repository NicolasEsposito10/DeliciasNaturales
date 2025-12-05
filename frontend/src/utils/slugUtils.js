/**
 * Utilidades para generar y parsear slugs de productos únicos
 * Formato: nombre-marca-id
 */

/**
 * Genera un slug único para un producto usando nombre + marca + ID
 * @param {Object} producto - Objeto producto con nombre, marca e id
 * @returns {string} Slug único del producto
 */
export const generarSlugProducto = (producto) => {
  if (!producto || !producto.id) {
    throw new Error('Producto debe tener un ID válido');
  }

  const nombre = producto.nombre || 'producto';
  const marca = producto.marca || 'sin-marca';
  const id = producto.id;

  // Limpiar y formatear cada parte
  const nombreLimpio = limpiarTextoParaSlug(nombre);
  const marcaLimpia = limpiarTextoParaSlug(marca);

  return `${nombreLimpio}-${marcaLimpia}-${id}`;
};

/**
 * Extrae el ID del producto desde un slug
 * @param {string} slug - El slug del producto
 * @returns {number|null} ID del producto o null si no se puede extraer
 */
export const extraerIdDeSlug = (slug) => {
  if (!slug) return null;

  // El ID está al final después del último guión
  const partes = slug.split('-');
  const ultimaParte = partes[partes.length - 1];
  
  const id = parseInt(ultimaParte, 10);
  return isNaN(id) ? null : id;
};

/**
 * Limpia texto para uso en slugs
 * @param {string} texto - Texto a limpiar
 * @returns {string} Texto limpio para slug
 */
const limpiarTextoParaSlug = (texto) => {
  if (!texto) return 'sin-nombre';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, '') // Remover guiones al inicio y final
    .trim();
};

/**
 * Valida si un slug tiene el formato correcto
 * @param {string} slug - Slug a validar
 * @returns {boolean} True si el formato es válido
 */
export const validarSlugProducto = (slug) => {
  if (!slug) return false;
  
  const id = extraerIdDeSlug(slug);
  return id !== null && id > 0;
};
