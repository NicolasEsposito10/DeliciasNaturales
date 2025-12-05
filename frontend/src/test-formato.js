// Archivo de prueba para verificar el formato argentino
import { formatearPrecio, formatearPorcentaje } from './utils/formatoArgentino';

console.log('=== PRUEBA FORMATO ARGENTINO ===');
console.log('formatearPrecio(1234.56):', formatearPrecio(1234.56));
console.log('formatearPorcentaje(15):', formatearPorcentaje(15));
console.log('formatearPrecio(0):', formatearPrecio(0));
console.log('formatearPorcentaje(0):', formatearPorcentaje(0));
console.log('=== FIN PRUEBA ===');
