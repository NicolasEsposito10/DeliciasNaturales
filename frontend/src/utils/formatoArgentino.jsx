import React, { useState, useEffect } from 'react';

/**
 * Utilidades para formateo de números en formato argentino
 * Miles con punto (.) y decimales con coma (,)
 */

/**
 * Convierte un número a formato argentino para mostrar
 * Ejemplo: 1234.56 -> "1.234,56"
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} Número formateado
 */
export const formatearNumeroArgentino = (numero, decimales = 2) => {
  if (numero === null || numero === undefined || isNaN(numero)) {
    return "0" + (decimales > 0 ? "," + "0".repeat(decimales) : "");
  }

  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(numero);
};

/**
 * Convierte un número a formato de precio argentino con símbolo $
 * Ejemplo: 1234.56 -> "$1.234,56"
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} Precio formateado
 */
export const formatearPrecio = (numero, decimales = 2) => {
  if (numero === null || numero === undefined || isNaN(numero)) {
    return "$0" + (decimales > 0 ? "," + "0".repeat(decimales) : "");
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(numero);
};

/**
 * Convierte texto en formato argentino a número para BD
 * Ejemplo: "1.234,56" -> 1234.56
 * @param {string} textoArgentino - Texto en formato argentino
 * @returns {number|null} Número convertido o null si es inválido
 */
export const parseNumeroArgentino = (textoArgentino) => {
  if (!textoArgentino || typeof textoArgentino !== 'string') {
    return null;
  }

  // Remover espacios y símbolo de pesos
  let limpio = textoArgentino.trim().replace(/[$\s]/g, '');
  
  // Si está vacío, retornar null
  if (limpio === '') {
    return null;
  }

  // Verificar formato argentino: números, puntos para miles, una coma para decimales
  const formatoArgentino = /^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$/;
  
  if (formatoArgentino.test(limpio)) {
    // Convertir formato argentino a estándar
    // 1. Remover puntos de miles
    // 2. Cambiar coma decimal por punto
    limpio = limpio.replace(/\./g, '').replace(',', '.');
  }
  
  // Intentar convertir a número
  const numero = parseFloat(limpio);
  
  return isNaN(numero) ? null : numero;
};

/**
 * Formatea un porcentaje en formato argentino
 * Ejemplo: 0.15 -> "15,00%"
 * @param {number} decimal - Número decimal (0.15 para 15%)
 * @param {number} decimales - Cantidad de decimales (default: 2)
 * @returns {string} Porcentaje formateado
 */
export const formatearPorcentaje = (decimal, decimales = 2) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return "0" + (decimales > 0 ? "," + "0".repeat(decimales) : "") + "%";
  }

  const porcentaje = decimal * 100;
  return formatearNumeroArgentino(porcentaje, decimales) + "%";
};

/**
 * Convierte porcentaje argentino a decimal para BD
 * Ejemplo: "15,50%" -> 0.155
 * @param {string} textoPorcentaje - Texto porcentaje argentino
 * @returns {number|null} Decimal convertido o null si es inválido
 */
export const parsePorcentajeArgentino = (textoPorcentaje) => {
  if (!textoPorcentaje || typeof textoPorcentaje !== 'string') {
    return null;
  }

  // Remover símbolo % y espacios
  const limpio = textoPorcentaje.trim().replace(/%/g, '');
  const numero = parseNumeroArgentino(limpio);
  
  return numero !== null ? numero / 100 : null;
};

/**
 * Valida si un texto está en formato argentino válido
 * @param {string} texto - Texto a validar
 * @returns {boolean} true si es formato válido
 */
export const esFormatoArgentinoValido = (texto) => {
  if (!texto || typeof texto !== 'string') {
    return false;
  }

  const limpio = texto.trim().replace(/[$\s]/g, '');
  const formatoArgentino = /^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$/;
  
  return formatoArgentino.test(limpio) || !isNaN(parseFloat(limpio));
};

/**
 * Componente de input que maneja formato argentino automáticamente
 */
export const InputNumeroArgentino = ({ 
  value, 
  onChange, 
  placeholder = "0,00", 
  className = "form-control",
  decimales = 2,
  ...props 
}) => {
  const [textoMostrado, setTextoMostrado] = useState('');
  
  useEffect(() => {
    // Cuando cambia el valor desde afuera, formatearlo
    if (value !== null && value !== undefined && !isNaN(value)) {
      setTextoMostrado(formatearNumeroArgentino(value, decimales));
    } else {
      setTextoMostrado('');
    }
  }, [value, decimales]);

  const manejarCambio = (e) => {
    const textoIngresado = e.target.value;
    setTextoMostrado(textoIngresado);
    
    // Convertir a número y notificar cambio
    const numero = parseNumeroArgentino(textoIngresado);
    if (onChange) {
      onChange(numero);
    }
  };

  const manejarBlur = () => {
    // Al perder foco, formatear correctamente
    const numero = parseNumeroArgentino(textoMostrado);
    if (numero !== null) {
      setTextoMostrado(formatearNumeroArgentino(numero, decimales));
    }
  };

  return (
    <input
      type="text"
      value={textoMostrado}
      onChange={manejarCambio}
      onBlur={manejarBlur}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};
