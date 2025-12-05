import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CarritoContext = createContext();

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const { user, loading } = useAuth(); // Agregamos loading del AuthContext
  const [carritoInicializado, setCarritoInicializado] = useState(false);

  // Generar clave única para el carrito del usuario
  const getCarritoKey = () => {
    return user ? `carrito_${user.id}` : 'carrito_invitado';
  };

  // Cargar carrito de invitado inmediatamente si no hay loading
  useEffect(() => {
    if (!loading && !user && !carritoInicializado) {
      const carritoInvitado = localStorage.getItem('carrito_invitado');
      if (carritoInvitado) {
        try {
          const carritoParseado = JSON.parse(carritoInvitado);
          setItems(carritoParseado);
          console.log('✅ Carrito de invitado cargado inmediatamente:', carritoParseado);
        } catch (error) {
          console.error('Error cargando carrito de invitado:', error);
          localStorage.removeItem('carrito_invitado');
        }
      }
      setCarritoInicializado(true);
    }
  }, [loading, user, carritoInicializado]);

  // Cargar carrito del localStorage cuando cambie el usuario (login/logout)
  useEffect(() => {
    // Solo procesar cambios de usuario, no la carga inicial
    if (loading || !carritoInicializado) return;
    
    const carritoKey = getCarritoKey();
    console.log(`🔄 Cambio de usuario detectado, cargando carrito con clave: ${carritoKey}`);
    
    // Si el usuario acaba de loguearse, verificar si hay un carrito pendiente
    if (user) {
      const carritoPendiente = localStorage.getItem('carrito_pendiente_login');
      if (carritoPendiente) {
        try {
          const carritoParseado = JSON.parse(carritoPendiente);
          console.log(`🔄 Asignando carrito pendiente al usuario ${user.id}:`, carritoParseado);
          
          // Verificar si el usuario ya tiene un carrito
          const carritoExistente = localStorage.getItem(carritoKey);
          if (carritoExistente) {
            // Combinar carritos inteligentemente (evitar duplicados)
            const carritoExistenteParseado = JSON.parse(carritoExistente);
            
            // Crear mapa de productos existentes para búsqueda rápida
            const productosExistentes = new Map();
            carritoExistenteParseado.forEach(item => {
              const clave = item.es_caso_2 
                ? `caso2_${item.producto_id}` 
                : `caso1_${item.producto_id}`;
              productosExistentes.set(clave, item);
            });
            
            // Procesar items del carrito pendiente
            const itemsFinales = [...carritoExistenteParseado];
            
            carritoParseado.forEach(itemPendiente => {
              const clave = itemPendiente.es_caso_2 
                ? `caso2_${itemPendiente.producto_id}` 
                : `caso1_${itemPendiente.producto_id}`;
              
              const itemExistente = productosExistentes.get(clave);
              
              if (itemExistente) {
                // Si existe, combinar cantidades
                const indice = itemsFinales.findIndex(item => item.id === itemExistente.id);
                if (itemPendiente.es_caso_2) {
                  // Caso 2: Sumar gramos
                  itemsFinales[indice].cantidad_personalizada += itemPendiente.cantidad_personalizada;
                  itemsFinales[indice].precio += itemPendiente.precio;
                  itemsFinales[indice].nombre = `${itemPendiente.nombre.split(' (')[0]} (${itemsFinales[indice].cantidad_personalizada}${itemPendiente.unidad_abrev || 'gr'})`;
                } else {
                  // Caso 1: Sumar unidades
                  itemsFinales[indice].cantidad += itemPendiente.cantidad;
                }
                console.log(`🔗 Producto combinado: ${itemPendiente.nombre}`);
              } else {
                // Si no existe, agregar nuevo
                itemsFinales.push(itemPendiente);
                console.log(`➕ Producto agregado: ${itemPendiente.nombre}`);
              }
            });
            
            setItems(itemsFinales);
            console.log(`🔗 Carritos combinados inteligentemente para usuario ${user.id}`);
          } else {
            // Solo asignar el carrito pendiente
            setItems(carritoParseado);
            console.log(`✅ Carrito pendiente asignado al usuario ${user.id}`);
          }
          
          // Limpiar el carrito pendiente
          localStorage.removeItem('carrito_pendiente_login');
          console.log('🗑️ Carrito pendiente eliminado');
          
          setCarritoInicializado(true);
          return; // Salir temprano para evitar la carga normal
        } catch (error) {
          console.error('Error asignando carrito pendiente:', error);
          localStorage.removeItem('carrito_pendiente_login');
        }
      }
    }
    
    // Carga normal del carrito (tanto para usuarios logueados como invitados)
    const carritoGuardado = localStorage.getItem(carritoKey);
    
    if (carritoGuardado) {
      try {
        const carritoParseado = JSON.parse(carritoGuardado);
        setItems(carritoParseado);
        console.log(`✅ Carrito cargado para ${user ? `usuario ${user.id}` : 'invitado'}:`, carritoParseado);
      } catch (error) {
        console.error('Error cargando carrito del localStorage:', error);
        localStorage.removeItem(carritoKey);
        setItems([]);
      }
    } else {
      // Si no hay carrito guardado, iniciar vacío
      console.log(`📭 No hay carrito guardado para ${user ? `usuario ${user.id}` : 'invitado'}, iniciando vacío`);
      console.log(`📭 No hay carrito guardado para ${user ? `usuario ${user.id}` : 'invitado'}, iniciando vacío`);
      setItems([]);
    }
  }, [user, carritoInicializado]); // Solo depende de cambios reales de usuario

  // Guardar carrito en localStorage cuando cambie (solo si ya está inicializado)
  useEffect(() => {
    if (!carritoInicializado) return;
    
    const carritoKey = getCarritoKey();
    localStorage.setItem(carritoKey, JSON.stringify(items));
    console.log(`💾 Carrito guardado para ${user ? `usuario ${user.id}` : 'invitado'}:`, items);
  }, [items, user, carritoInicializado]);

  // Limpiar carrito del usuario actual
  const vaciarCarrito = () => {
    setItems([]);
    const carritoKey = getCarritoKey();
    localStorage.removeItem(carritoKey);
    console.log(`🗑️ Carrito vaciado para ${user ? `usuario ${user.id}` : 'invitado'}`);
  };

  const agregarAlCarrito = (producto) => {
    setItems(prevItems => {
      const itemsActualizados = [...prevItems];
      
      // Para productos del Caso 2, buscar si ya existe el mismo producto (sin importar la cantidad)
      let indiceExistente = -1;
      
      if (producto.es_caso_2) {
        // Caso 2: Buscar por producto_id únicamente, ignorar cantidad_personalizada
        indiceExistente = itemsActualizados.findIndex(item => 
          item.producto_id === producto.id && item.es_caso_2
        );
      } else if (producto.es_caso_1) {
        // Caso 1: Buscar por producto_id para productos por unidad
        indiceExistente = itemsActualizados.findIndex(item => 
          item.producto_id === producto.id && item.es_caso_1
        );
      } else {
        // Fallback: buscar por producto_id
        indiceExistente = itemsActualizados.findIndex(item => 
          item.producto_id === producto.id
        );
      }
      
      if (indiceExistente >= 0) {
        // Si existe el producto, incrementar cantidad
        if (producto.es_caso_2) {
          // Para Caso 2: Agregar la cantidad de gramos a la cantidad personalizada existente
          const itemExistente = itemsActualizados[indiceExistente];
          const nuevaCantidadGramos = itemExistente.cantidad_personalizada + producto.cantidad_personalizada;
          const nuevoPrecio = (producto.producto_original?.precio_fraccionado_por_100 || itemExistente.producto_original?.precio_fraccionado_por_100) * nuevaCantidadGramos / 100;
          
          itemsActualizados[indiceExistente] = {
            ...itemExistente,
            cantidad_personalizada: nuevaCantidadGramos,
            precio: nuevoPrecio,
            nombre: `${producto.nombre.split(' (')[0]} (${nuevaCantidadGramos}${producto.unidad_abrev || 'gr'})`
          };
        } else {
          // Para Caso 1: Incrementar cantidad normal
          itemsActualizados[indiceExistente] = {
            ...itemsActualizados[indiceExistente],
            cantidad: itemsActualizados[indiceExistente].cantidad + 1
          };
        }
      } else {
        // Si no existe, crear nuevo item
        const itemId = `${producto.id}_${Date.now()}`;
        
        const nuevoItem = {
          id: itemId,
          producto_id: producto.id,
          nombre: producto.nombre_display || producto.nombre_personalizado || producto.nombre,
          marca: producto.marca,
          precio: producto.precio_total || producto.precio_personalizado || producto.precio_unitario || parseFloat(producto.precio || 0),
          cantidad: 1,
          imagen: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : null,
          
          // Información específica del tipo
          es_caso_1: producto.es_caso_1 || false,
          es_caso_2: producto.es_caso_2 || false,
          cantidad_personalizada: producto.cantidad_personalizada || null,
          unidad_abrev: producto.unidad_abrev || null,
          
          // Para debugging y recálculos
          producto_original: producto
        };
        
        itemsActualizados.push(nuevoItem);
      }
      
      return itemsActualizados;
    });
  };

  const eliminarDelCarrito = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const actualizarCantidad = (itemId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(itemId);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );
  };

  const obtenerTotal = () => {
    return items.reduce((total, item) => {
      if (item.es_caso_2) {
        // Para Caso 2, el precio ya está calculado para toda la cantidad_personalizada
        return total + item.precio;
      } else {
        // Para Caso 1, multiplicar precio por cantidad
        return total + (item.precio * item.cantidad);
      }
    }, 0);
  };

  const obtenerCantidadTotal = () => {
    return items.reduce((total, item) => {
      return total + item.cantidad;
    }, 0);
  };

  // Función para finalizar pedido y limpiar carrito
  const finalizarPedido = () => {
    const totalItems = items.length;
    const totalImporte = obtenerTotal();
    
    console.log(`🛒 Finalizando pedido: ${totalItems} productos, total: $${totalImporte}`);
    vaciarCarrito();
    
    return {
      totalItems,
      totalImporte,
      items: [...items] // Copia de los items antes de limpiar
    };
  };

  const value = {
    items,
    setItems,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    vaciarCarrito,
    finalizarPedido,
    obtenerTotal,
    obtenerCantidadTotal
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};
