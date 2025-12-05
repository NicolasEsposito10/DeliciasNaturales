// Prueba de las funciones de slug
import { generarSlugProducto, extraerIdDeSlug, validarSlugProducto } from '../utils/slugUtils.js';

console.log('=== PRUEBAS DE SLUGS ÚNICOS ===');

// Producto de prueba 1
const producto1 = {
  id: 123,
  nombre: 'Aceite de CBD 20% de Cannavis',
  marca: 'Marca de Prueba'
};

// Producto de prueba 2 (mismo nombre, diferente marca)
const producto2 = {
  id: 456,
  nombre: 'Aceite de CBD 20% de Cannavis',
  marca: 'Otra Marca'
};

// Producto sin marca
const producto3 = {
  id: 789,
  nombre: 'Producto Sin Marca'
};

console.log('Producto 1:');
const slug1 = generarSlugProducto(producto1);
console.log('Slug:', slug1);
console.log('ID extraído:', extraerIdDeSlug(slug1));
console.log('Válido:', validarSlugProducto(slug1));

console.log('\nProducto 2 (mismo nombre):');
const slug2 = generarSlugProducto(producto2);
console.log('Slug:', slug2);
console.log('ID extraído:', extraerIdDeSlug(slug2));
console.log('Válido:', validarSlugProducto(slug2));

console.log('\nProducto 3 (sin marca):');
const slug3 = generarSlugProducto(producto3);
console.log('Slug:', slug3);
console.log('ID extraído:', extraerIdDeSlug(slug3));
console.log('Válido:', validarSlugProducto(slug3));

console.log('\n=== RESULTADOS ESPERADOS ===');
console.log('✅ Producto 1: aceite-de-cbd-20-de-cannavis-marca-de-prueba-123');
console.log('✅ Producto 2: aceite-de-cbd-20-de-cannavis-otra-marca-456');
console.log('✅ Producto 3: producto-sin-marca-sin-marca-789');
console.log('✅ URLs diferentes aunque el nombre sea igual');
console.log('=== FIN PRUEBAS ===');
