import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { formatearPrecio, formatearPorcentaje } from '../../../utils/formatoArgentino.jsx';

function ProductosABMC() {
  const location = useLocation();
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [editando, setEditando] = useState(false);
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  
  // Estados para búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const productosPorPagina = 50;
  
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    disponible: true,
    descripcion: '',
    proveedor_id: '',
    categoria_id: '',
    marca_id: '',
    unidad_id: '',
    etiquetas_ids: [],
    // CASO 1: Por Unidades
    cantidad_unidades: '1',
    precio_costo_caso1: '',
    porcentaje_ganancia_caso1: '',
    // CASO 2: Por Peso/Volumen
    precio_costo_caso2: '',
    porcentaje_ganancia_caso2: '',
    cantidad_caso2: '100'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Detectar si se debe abrir el formulario automáticamente
  useEffect(() => {
    if (location.state?.abrirFormulario) {
      limpiarForm();
      setMostrandoForm(true);
      // Limpiar el state para evitar que se abra de nuevo al navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    filtrarProductos();
  }, [productos, busqueda]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [prodRes, provRes, catRes, etiquetasRes, marcRes, unidRes] = await Promise.all([
        axios.get('/api/productos'),
        axios.get('/api/proveedores'),
        axios.get('/api/categorias'),
        axios.get('/api/etiquetas'),
        axios.get('/api/marcas'),
        axios.get('/api/unidades')
      ]);
      setProductos(prodRes.data);
      setProveedores(provRes.data);
      setCategorias(catRes.data);
      setEtiquetas(etiquetasRes.data);
      setMarcas(marcRes.data);
      setUnidades(unidRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarProductos = () => {
    if (!busqueda.trim()) {
      setProductosFiltrados(productos);
      setPaginaActual(1);
      return;
    }

    const terminoBusqueda = busqueda.toLowerCase().trim();
    const resultados = productos.filter(producto => 
      producto.nombre?.toLowerCase().includes(terminoBusqueda) ||
      producto.proveedor?.toLowerCase().includes(terminoBusqueda) ||
      producto.marca?.toLowerCase().includes(terminoBusqueda) ||
      producto.categoria?.toLowerCase().includes(terminoBusqueda)
    );
    
    setProductosFiltrados(resultados);
    setPaginaActual(1);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  // Calcular productos para la página actual
  const indiceInicio = (paginaActual - 1) * productosPorPagina;
  const indiceFin = indiceInicio + productosPorPagina;
  const productosActuales = productosFiltrados.slice(indiceInicio, indiceFin);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      // Scroll suave hacia arriba de la tabla
      document.querySelector('.table-responsive')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
    }
  };

  const limpiarForm = () => {
    setFormData({
      id: '', nombre: '', disponible: true, descripcion: '',
      proveedor_id: '', categoria_id: '', marca_id: '', unidad_id: '',
      etiquetas_ids: [],
      cantidad_unidades: '1',
      precio_costo_caso1: '',
      porcentaje_ganancia_caso1: '',
      precio_costo_caso2: '',
      porcentaje_ganancia_caso2: '',
      cantidad_caso2: '100'
    });
    setEditando(false);
    setImagenes([]);
  };

  const agregarImagen = () => {
    const nuevaImagen = {
      id: `temp-${Date.now()}`, // ID temporal para nuevas imágenes
      imagen_file: null,
      es_url: false, // Solo archivos ahora
      posicion: imagenes.length,
      titulo: '',
      preview: null // Para vista previa
    };
    setImagenes([...imagenes, nuevaImagen]);
  };

  const eliminarImagen = (id) => {
    if (id.toString().startsWith('temp-')) {
      // Es una imagen nueva, solo eliminar del estado
      setImagenes(imagenes.filter(img => img.id !== id));
    } else {
      // Es una imagen existente, eliminar del backend
      if (window.confirm('¿Confirma eliminar esta imagen?')) {
        axios.delete(`/api/imagenes/${id}`)
          .then(() => {
            setImagenes(imagenes.filter(img => img.id !== id));
          })
          .catch(error => console.error('Error eliminando imagen:', error));
    }
  }
  };

  const actualizarImagen = (id, campo, valor) => {
    setImagenes(imagenes.map(img => {
      if (img.id === id) {
        const actualizada = { ...img, [campo]: valor };
        
        // Si es un archivo subido
        if (campo === 'imagen_file' && valor) {
          actualizada.es_url = false;
          
          // Crear preview para el archivo
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagenes(imgs => imgs.map(i => 
              i.id === id ? { ...i, preview: e.target.result } : i
            ));
          };
          reader.readAsDataURL(valor);
        }
        
        return actualizada;
      }
      return img;
    }));
  };

  const reordenarImagenes = (resultado) => {
    if (!resultado.destination) return;
    
    const items = Array.from(imagenes);
    const [reordered] = items.splice(resultado.source.index, 1);
    items.splice(resultado.destination.index, 0, reordered);
    
    // Actualizar posiciones
    const imagenesActualizadas = items.map((img, index) => ({
      ...img,
      posicion: index
    }));
    
    setImagenes(imagenesActualizadas);
    
    // Si estamos editando, enviar las nuevas posiciones al backend
    if (editando && formData.id) {
      const imagenesGuardadas = imagenesActualizadas.filter(img => !img.id.toString().startsWith('temp-'));
      if (imagenesGuardadas.length > 1) {
        axios.put(`/api/productos/${formData.id}/imagenes/reordenar`, {
          posiciones: imagenesGuardadas.map(img => ({
            id: img.id,
            posicion: img.posicion
          }))
        }).catch(error => console.error('Error reordenando imágenes:', error));
      }
    }
  };

  const editarProducto = (producto) => {
    console.log('Editando producto:', producto);
    
    // Determinar si es caso 1 o caso 2
    const unidadSeleccionada = unidades.find(u => u.id === producto.unidad_id);
    console.log('🔍 Unidad seleccionada al editar:', unidadSeleccionada);
    
    // Usar la misma lógica que getEsCaso1 pero con la unidad del producto
    let esCaso1 = false;
    if (unidadSeleccionada) {
      const nombre = unidadSeleccionada.nombre?.toLowerCase() || '';
      const abrev = unidadSeleccionada.abreviacion?.toLowerCase() || '';
      esCaso1 = nombre.includes('unidad') || 
                abrev === 'u' || 
                abrev === 'unidad' || 
                abrev === 'unidades' ||
                nombre === 'unidades' ||
                nombre === 'unidad';
    }
    
    console.log('✅ Es caso 1 al editar:', esCaso1);
    
    setFormData({ 
      ...producto,
      proveedor_id: producto.proveedor_id?.toString() || '',
      categoria_id: producto.categoria_id?.toString() || '',
      marca_id: producto.marca_id?.toString() || '',
      unidad_id: producto.unidad_id?.toString() || '',
      etiquetas_ids: producto.etiquetas_ids || [],
      // Mapear campos según el caso
      cantidad_unidades: producto.cantidad_unidades?.toString() || '1',
      precio_costo_caso1: esCaso1 ? producto.precio_costo?.toString() || '' : '',
      porcentaje_ganancia_caso1: esCaso1 ? (producto.porcentaje_ganancia * 100)?.toString() || '' : '',
      precio_costo_caso2: !esCaso1 ? producto.precio_costo?.toString() || '' : '',
      porcentaje_ganancia_caso2: !esCaso1 ? (producto.porcentaje_ganancia * 100)?.toString() || '' : '',
      cantidad_caso2: producto.cantidad?.toString() || '100'
    });
    
    setEditando(true);
    setMostrandoForm(true);
    
    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('.card')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
    
    // Cargar las imágenes del producto
    if (producto.imagenes && producto.imagenes.length > 0) {
      setImagenes(producto.imagenes);
    } else {
      axios.get(`/api/productos/${producto.id}/imagenes`)
        .then(res => setImagenes(res.data))
        .catch(error => console.error('Error cargando imágenes:', error));
    }
  };

  // Determinar si estamos en caso 1 o caso 2
  const getEsCaso1 = () => {
    const unidadSeleccionada = unidades.find(u => u.id === parseInt(formData.unidad_id));
    if (!unidadSeleccionada) return false;
    
    // Verificar tanto el nombre como la abreviación para detectar unidades
    const nombre = unidadSeleccionada.nombre?.toLowerCase() || '';
    const abrev = unidadSeleccionada.abreviacion?.toLowerCase() || '';
    
    console.log('🔍 Detectando caso:', {
      id: unidadSeleccionada.id,
      nombre: unidadSeleccionada.nombre,
      abreviacion: unidadSeleccionada.abreviacion,
      nombreLower: nombre,
      abrevLower: abrev
    });
    
    // Buscar variaciones de "unidad" o "unidades"
    const esUnidad = nombre.includes('unidad') || 
                    abrev === 'u' || 
                    abrev === 'unidad' || 
                    abrev === 'unidades' ||
                    nombre === 'unidades' ||
                    nombre === 'unidad';
    
    console.log('✅ Es caso 1 (unidades):', esUnidad);
    return esUnidad;
  };

  // Función para calcular precios según el caso
  const calcularPrecios = () => {
    const esCaso1 = getEsCaso1();
    
    if (esCaso1) {
      // CASO 1: Por Unidades
      const precioCosto = parseFloat(formData.precio_costo_caso1 || 0);
      const porcentajeGananciaDecimal = parseFloat(formData.porcentaje_ganancia_caso1 || 0) / 100;
      const cantidadUnidades = parseInt(formData.cantidad_unidades || 1);
      
      console.log('🧮 CASO 1 - Calculando:', {
        precioCosto,
        porcentajeGananciaCaso1: formData.porcentaje_ganancia_caso1,
        porcentajeGananciaDecimal,
        cantidadUnidades
      });
      
      // FÓRMULA CORREGIDA: precio_costo + (precio_costo * porcentaje_ganancia)
      const precioConGanancia = precioCosto + (precioCosto * porcentajeGananciaDecimal);
      const precioPorUnidad = precioConGanancia / cantidadUnidades;
      
      const resultado = {
        valido: precioCosto > 0 && porcentajeGananciaDecimal >= 0 && cantidadUnidades >= 1 && 
                !isNaN(precioCosto) && !isNaN(porcentajeGananciaDecimal) && !isNaN(cantidadUnidades),
        precioConGanancia: precioConGanancia,
        precioPorUnidad: precioPorUnidad,
        descripcion: `${cantidadUnidades} unidad${cantidadUnidades > 1 ? 'es' : ''} por ${formatearPrecio(precioConGanancia)}`
      };
      
      console.log('🧮 CASO 1 - Resultado:', resultado);
      return resultado;
    } else {
      // CASO 2: Por Peso/Volumen
      const precioCosto = parseFloat(formData.precio_costo_caso2 || 0);
      const porcentajeGananciaDecimal = parseFloat(formData.porcentaje_ganancia_caso2 || 0) / 100;
      const cantidad = parseFloat(formData.cantidad_caso2 || 100);
      
      console.log('🧮 CASO 2 - Calculando:', {
        precioCosto,
        porcentajeGananciaCaso2: formData.porcentaje_ganancia_caso2,
        porcentajeGananciaDecimal,
        cantidad
      });
      
      // FÓRMULA CORREGIDA: precio_costo + (precio_costo * porcentaje_ganancia)
      const precioConGanancia = precioCosto + (precioCosto * porcentajeGananciaDecimal);
      const cantidadPor100 = cantidad / 100;
      const precioFraccionadoPor100 = precioConGanancia / cantidadPor100;
      
      const unidadSeleccionada = unidades.find(u => u.id === parseInt(formData.unidad_id));
      const nombreUnidad = unidadSeleccionada?.abreviacion || 'unidad';
      
      const resultado = {
        valido: precioCosto > 0 && porcentajeGananciaDecimal >= 0 && cantidad >= 100 &&
                !isNaN(precioCosto) && !isNaN(porcentajeGananciaDecimal) && !isNaN(cantidad),
        precioConGanancia: precioConGanancia,
        precioFraccionadoPor100: precioFraccionadoPor100,
        descripcion: `${cantidad}${nombreUnidad} por ${formatearPrecio(precioConGanancia)}`,
        nombreUnidad: nombreUnidad
      };
      
      console.log('🧮 CASO 2 - Resultado:', resultado);
      return resultado;
    }
  };

  // Manejar cambio de unidad
  const handleUnidadChange = (e) => {
    const unidadId = e.target.value;
    
    console.log('🔄 Cambiando unidad a ID:', unidadId);
    
    setFormData(prev => ({
      ...prev,
      unidad_id: unidadId,
      // Limpiar campos del caso anterior
      precio_costo_caso1: '',
      porcentaje_ganancia_caso1: '',
      precio_costo_caso2: '',
      porcentaje_ganancia_caso2: '',
      cantidad_unidades: '1',
      cantidad_caso2: '100'
    }));
    
    // Forzar re-render para que se actualice la UI
    setTimeout(() => {
      const unidadSeleccionada = unidades.find(u => u.id === parseInt(unidadId));
      console.log('🎯 Unidad después del cambio:', unidadSeleccionada);
      console.log('🎯 Es caso 1 después del cambio:', getEsCaso1());
    }, 100);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      const esCaso1 = getEsCaso1();
      const precios = calcularPrecios();
      
      console.log('🚀 ENVIANDO DATOS:', {
        esCaso1,
        precio_costo_caso1: formData.precio_costo_caso1,
        porcentaje_ganancia_caso1: formData.porcentaje_ganancia_caso1,
        precio_costo_caso2: formData.precio_costo_caso2,
        porcentaje_ganancia_caso2: formData.porcentaje_ganancia_caso2,
        precios
      });
      
      if (!precios.valido) {
        alert('Por favor, complete todos los campos requeridos con valores válidos');
        return;
      }

      let productoId;
      
      // Preparar porcentaje de ganancia correctamente (como decimal para la BD)
      let porcentajeGananciaDecimal;
      if (esCaso1) {
        porcentajeGananciaDecimal = parseFloat(formData.porcentaje_ganancia_caso1 || 0) / 100;
      } else {
        porcentajeGananciaDecimal = parseFloat(formData.porcentaje_ganancia_caso2 || 0) / 100;
      }
      
      // Preparar precio costo correctamente
      let precioCosto;
      if (esCaso1) {
        precioCosto = parseFloat(formData.precio_costo_caso1 || 0);
      } else {
        precioCosto = parseFloat(formData.precio_costo_caso2 || 0);
      }
      
      console.log('🔢 VALORES CALCULADOS:', {
        precioCosto,
        porcentajeGananciaDecimal,
        porcentajeGananciaPorcentaje: porcentajeGananciaDecimal * 100
      });
      
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        disponible: formData.disponible,
        proveedor_id: parseInt(formData.proveedor_id),
        categoria_id: parseInt(formData.categoria_id),
        marca_id: parseInt(formData.marca_id),
        unidad_id: parseInt(formData.unidad_id),
        etiquetas_ids: formData.etiquetas_ids,
        fecha_ultima_modificacion: new Date().toISOString(),
        // Campos específicos según el caso
        precio_costo: precioCosto,
        porcentaje_ganancia: porcentajeGananciaDecimal, // Enviar como decimal (0.5 para 50%)
        cantidad_unidades: esCaso1 ? parseInt(formData.cantidad_unidades || 1) : null,
        cantidad: !esCaso1 ? parseFloat(formData.cantidad_caso2 || 100) : null,
        precio_por_unidad: esCaso1 ? precios.precioPorUnidad : null,
        precio_fraccionado_por_100: !esCaso1 ? precios.precioFraccionadoPor100 : null,
        tipo_calculo: esCaso1 ? 'unidad' : 'peso'
      };
      
      console.log('📤 DATOS A ENVIAR AL BACKEND:', dataToSend);
      
      if (editando) {
        await axios.put(`/api/productos/${formData.id}`, dataToSend);
        productoId = formData.id;
        console.log('✅ Producto actualizado');
      } else {
        const res = await axios.post('/api/productos', dataToSend);
        productoId = res.data.id;
        console.log('✅ Producto creado con ID:', productoId);
      }
      
      // Guardar las imágenes
      for (const imagen of imagenes) {
        if (imagen.id.toString().startsWith('temp-')) {
          // Es una imagen nueva - solo procesamos archivos subidos
          if (!imagen.es_url && imagen.imagen_file) {
            const formDataImg = new FormData();
            formDataImg.append('imagen', imagen.imagen_file);
            formDataImg.append('titulo', imagen.titulo || '');
            formDataImg.append('posicion', imagen.posicion);
            
            await axios.post(`/api/productos/${productoId}/imagenes`, formDataImg, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
          }
        }
      }
      
      // Recargar datos y limpiar formulario
      await cargarDatos(); // Asegurar que se complete la recarga
      limpiarForm();
      setMostrandoForm(false);
      setImagenes([]);
      
      // Mostrar mensaje de éxito
      alert(editando ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      
    } catch (error) {
      console.error('❌ Error guardando producto:', error);
      console.error('📋 Response data:', error.response?.data);
      console.error('📋 Response status:', error.response?.status);
      alert(`Error al guardar el producto: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEtiquetaChange = (etiquetaId, isChecked) => {
    setFormData(prev => {
      let newEtiquetasIds;
      
      if (isChecked) {
        // Verificar si ya tiene 3 etiquetas seleccionadas
        if (prev.etiquetas_ids.length >= 3) {
          alert('Solo puedes seleccionar un máximo de 3 etiquetas por producto');
          return prev; // No hacer cambios
        }
        newEtiquetasIds = [...prev.etiquetas_ids, etiquetaId];
      } else {
        newEtiquetasIds = prev.etiquetas_ids.filter(id => id !== etiquetaId);
      }
      
      return {
        ...prev,
        etiquetas_ids: newEtiquetasIds
      };
    });
  };

  const borrarProducto = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      axios.delete(`/api/productos/${id}`)
        .then(() => {
          cargarDatos();
        })
        .catch(error => console.error('Error eliminando producto:', error));
    }
  };

  // Función para calcular y mostrar el precio fraccionado según el tipo
  const calcularPrecioFraccionado = (producto) => {
    // Determinar si es caso 1 o caso 2
    const unidadSeleccionada = unidades.find(u => u.id === producto.unidad_id);
    if (!unidadSeleccionada) return { precio: 'N/A', unidad: '' };
    
    const nombre = unidadSeleccionada.nombre?.toLowerCase() || '';
    const abrev = unidadSeleccionada.abreviacion?.toLowerCase() || '';
    
    const esCaso1 = nombre.includes('unidad') || 
                    abrev === 'u' || 
                    abrev === 'unidad' || 
                    abrev === 'unidades' ||
                    nombre === 'unidades' ||
                    nombre === 'unidad';
    
    if (esCaso1) {
      // CASO 1: Por Unidades - mostrar precio por unidad
      if (producto.precio_por_unidad && producto.precio_por_unidad > 0) {
        return {
          precio: formatearPrecio(producto.precio_por_unidad),
          unidad: 'por unidad',
          tipo: 'Caso 1'
        };
      } else if (producto.cantidad_unidades && producto.precio_venta_publico) {
        // Calcular si no está guardado
        const precioPorUnidad = producto.precio_venta_publico / producto.cantidad_unidades;
        return {
          precio: formatearPrecio(precioPorUnidad),
          unidad: 'por unidad',
          tipo: 'Caso 1'
        };
      } else if (producto.precio_costo && producto.porcentaje_ganancia && producto.cantidad_unidades) {
        // Calcular usando la fórmula corregida
        const precioConGanancia = producto.precio_costo + (producto.precio_costo * producto.porcentaje_ganancia);
        const precioPorUnidad = precioConGanancia / producto.cantidad_unidades;
        return {
          precio: formatearPrecio(precioPorUnidad),
          unidad: 'por unidad',
          tipo: 'Caso 1'
        };
      }
    } else {
      // CASO 2: Por Peso/Volumen - mostrar precio por 100gr/ml
      if (producto.precio_fraccionado_por_100 && producto.precio_fraccionado_por_100 > 0) {
        return {
          precio: formatearPrecio(producto.precio_fraccionado_por_100),
          unidad: `por 100${unidadSeleccionada.abreviacion || 'gr'}`,
          tipo: 'Caso 2'
        };
      } else if (producto.cantidad && producto.precio_venta_publico) {
        // Calcular si no está guardado
        const cantidadPor100 = producto.cantidad / 100;
        const precioFraccionado = producto.precio_venta_publico / cantidadPor100;
        return {
          precio: formatearPrecio(precioFraccionado),
          unidad: `por 100${unidadSeleccionada.abreviacion || 'gr'}`,
          tipo: 'Caso 2'
        };
      } else if (producto.precio_costo && producto.porcentaje_ganancia && producto.cantidad) {
        // Calcular usando la fórmula corregida
        const precioConGanancia = producto.precio_costo + (producto.precio_costo * producto.porcentaje_ganancia);
        const cantidadPor100 = producto.cantidad / 100;
        const precioFraccionado = precioConGanancia / cantidadPor100;
        return {
          precio: formatearPrecio(precioFraccionado),
          unidad: `por 100${unidadSeleccionada.abreviacion || 'gr'}`,
          tipo: 'Caso 2'
        };
      }
    }
    
    return { precio: 'N/A', unidad: '', tipo: 'N/A' };
  };

  // Renderizado del componente
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Productos</h2>
        <button 
          className="btn btn-primary"
          onClick={() => { limpiarForm(); setMostrandoForm(true); }}
        >
          Nuevo Producto
        </button>
      </div>

      {mostrandoForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={manejarSubmit}>
              {/* Campos básicos */}
              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3 d-flex align-items-center">
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="switchDisponible"
                      checked={formData.disponible}
                      onChange={(e) => setFormData({...formData, disponible: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="switchDisponible">
                      <strong>{formData.disponible ? 'Producto Disponible (HAY STOCK)' : 'Producto No Disponible (NO HAY STOCK)'}</strong>
                      <br />
                      <small className="text-muted">
                        {formData.disponible ? 'Visible en la tienda' : 'Oculto en la tienda'}
                      </small>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-control" 
                  value={formData.descripcion || ''} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                  rows="3"
                  placeholder="Descripción del producto..."
                ></textarea>
              </div>

              {/* Selección de unidad */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Unidad de Medida *</label>
                  <select
                    className="form-select"
                    value={formData.unidad_id}
                    onChange={handleUnidadChange}
                    required
                  >
                    <option value="">Seleccionar unidad...</option>
                    {unidades.map(unidad => (
                      <option key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.abreviacion})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Unidades disponibles: {unidades.length}
                  </small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Tipo de Cálculo</label>
                  <div className="form-control bg-light">
                    <strong>
                      {formData.unidad_id ? (
                        getEsCaso1() ? 'CASO 1: Por Unidades' : 'CASO 2: Por Peso/Volumen'
                      ) : (
                        'Seleccione una unidad primero'
                      )}
                    </strong>
                    <br />
                    <small className="text-muted">
                      {formData.unidad_id ? (
                        getEsCaso1() 
                          ? 'Precio fijo para un conjunto de unidades'
                          : 'Precio calculado por peso/volumen'
                      ) : (
                        'El tipo se determinará automáticamente'
                      )}
                    </small>
                    {formData.unidad_id && (
                      <div className="mt-1">
                        <small className="text-info">
                          Unidad seleccionada: {unidades.find(u => u.id === parseInt(formData.unidad_id))?.nombre}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CASO 1: Por Unidades */}
              {formData.unidad_id && getEsCaso1() && (
                <>
                  <div className="alert alert-primary">
                    <h6><strong>📦 CASO 1: Producto por Unidades</strong></h6>
                    <small>Complete los siguientes campos para productos vendidos por unidades (ej: 12 alfajores)</small>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Cantidad de Unidades *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={formData.cantidad_unidades}
                        onChange={(e) => setFormData({...formData, cantidad_unidades: e.target.value})}
                        placeholder="Ej: 12"
                        required
                      />
                      <small className="text-muted">Mínimo 1 unidad</small>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">PRECIO COSTO *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={formData.precio_costo_caso1}
                          onChange={(e) => setFormData({...formData, precio_costo_caso1: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">% de Ganancia *</label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          className="form-control"
                          value={formData.porcentaje_ganancia_caso1}
                          onChange={(e) => setFormData({...formData, porcentaje_ganancia_caso1: e.target.value})}
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Cálculos CASO 1 */}
                  {formData.precio_costo_caso1 && formData.porcentaje_ganancia_caso1 && formData.cantidad_unidades && (
                    (() => {
                      const precios = calcularPrecios();
                      if (precios.valido) {
                        return (
                          <div className="alert alert-success mb-3 border-0 shadow-sm">
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="text-success fw-bold mb-1">
                                  💰 Precio de Ganancia del Paquete:
                                </h6>
                                <h5 className="text-success">{formatearPrecio(precios.precioConGanancia)}</h5>
                                <small className="text-muted">{precios.descripcion}</small>
                              </div>
                              <div className="col-md-6">
                                <h6 className="text-primary fw-bold mb-1">
                                  📦 Precio Por Unidad:
                                </h6>
                                <h5 className="text-primary">{formatearPrecio(precios.precioPorUnidad)}</h5>
                                <small className="text-muted">por cada unidad individual</small>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </>
              )}

              {/* CASO 2: Por Peso/Volumen */}
              {formData.unidad_id && !getEsCaso1() && (
                <>
                  <div className="alert alert-warning">
                    <h6><strong>⚖️ CASO 2: Producto por Peso/Volumen</strong></h6>
                    <small>Complete los siguientes campos para productos vendidos por peso/volumen (ej: 500g de queso)</small>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label className="form-label">PRECIO DE COSTO *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={formData.precio_costo_caso2}
                          onChange={(e) => setFormData({...formData, precio_costo_caso2: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">% de GANANCIA *</label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          className="form-control"
                          value={formData.porcentaje_ganancia_caso2}
                          onChange={(e) => setFormData({...formData, porcentaje_ganancia_caso2: e.target.value})}
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Unidad</label>
                      <div className="form-control bg-light">
                        {unidades.find(u => u.id === parseInt(formData.unidad_id))?.abreviacion || 'N/A'}
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">CANTIDAD *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="100"
                        className="form-control"
                        value={formData.cantidad_caso2}
                        onChange={(e) => setFormData({...formData, cantidad_caso2: e.target.value})}
                        placeholder="Ej: 500"
                        required
                      />
                      <small className="text-muted">Mínimo 100</small>
                    </div>
                  </div>

                  {/* Cálculos CASO 2 */}
                  {formData.precio_costo_caso2 && formData.porcentaje_ganancia_caso2 && formData.cantidad_caso2 && (
                    (() => {
                      const precios = calcularPrecios();
                      if (precios.valido) {
                        return (
                          <div className="alert alert-success mb-3 border-0 shadow-sm">
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="text-success fw-bold mb-1">
                                  💰 Precio Costo con Ganancia:
                                </h6>
                                <h5 className="text-success">{formatearPrecio(precios.precioConGanancia)}</h5>
                                <small className="text-muted">{precios.descripcion}</small>
                              </div>
                              <div className="col-md-6">
                                <h6 className="text-primary fw-bold mb-1">
                                  ⚖️ Precio Fraccionado por 100{precios.nombreUnidad}:
                                </h6>
                                <h5 className="text-primary">{formatearPrecio(precios.precioFraccionadoPor100)}</h5>
                                <small className="text-muted">por cada 100{precios.nombreUnidad}</small>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </>
              )}

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Proveedor *</label>
                  <select
                    className="form-select"
                    value={formData.proveedor_id}
                    onChange={(e) => setFormData({...formData, proveedor_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Categoría *</label>
                  <select
                    className="form-select"
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Marca *</label>
                  <select
                    className="form-select"
                    value={formData.marca_id}
                    onChange={(e) => setFormData({...formData, marca_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {marcas.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección de Etiquetas */}
              <div className="mb-3">
                <label className="form-label">
                  Etiquetas 
                  <small className="text-muted">
                    <br />(máximo 3) - {formData.etiquetas_ids.length}/3 seleccionadas
                  </small>
                </label>
                <div className="border rounded p-3 bg-light">
                  <div className="row">
                    {etiquetas.map(etiqueta => {
                      const isSelected = formData.etiquetas_ids.includes(etiqueta.id);
                      const isDisabled = !isSelected && formData.etiquetas_ids.length >= 3;
                      
                      return (
                        <div key={etiqueta.id} className="col-md-4 col-lg-3 mb-2">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`etiqueta-${etiqueta.id}`}
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={(e) => handleEtiquetaChange(etiqueta.id, e.target.checked)}
                            />
                            <label 
                              className={`form-check-label ${isDisabled ? 'text-muted' : ''}`} 
                              htmlFor={`etiqueta-${etiqueta.id}`}
                            >
                              {etiqueta.nombre}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formData.etiquetas_ids.length === 0 && (
                    <small className="text-muted">Selecciona al menos una etiqueta para el producto</small>
                  )}
                  {formData.etiquetas_ids.length >= 3 && (
                    <small className="text-warning">
                      <i className="bi bi-exclamation-triangle-fill"></i> Has alcanzado el límite máximo de 3 etiquetas
                    </small>
                  )}
                </div>
              </div>

              {/* Sección de imágenes */}
              <div className="mb-3">
                <label className="form-label">Imágenes</label>
                <div className="mb-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={agregarImagen}
                  >
                    <i className="bi bi-plus-circle"></i> Agregar imagen
                  </button>
                </div>
                
                {imagenes.length === 0 ? (
                  <div className="alert alert-info">
                    No hay imágenes. Agregue al menos una imagen para el producto.
                  </div>
                ) : (
                  <div className="row">
                    {imagenes.map((imagen, index) => (
                      <div key={imagen.id} className="col-md-4 mb-3">
                        <div className="card">
                          <div className="position-relative">
                            {(imagen.preview || (!imagen.es_url && imagen.imagen_base64)) ? (
                              <img 
                                src={
                                  imagen.preview || 
                                  `data:image/jpeg;base64,${imagen.imagen_base64}`
                                } 
                                className="card-img-top" 
                                alt="Vista previa" 
                                style={{height: "150px", objectFit: "cover"}}
                              />
                            ) : (
                              <div className="bg-light text-center py-5">
                                <i className="bi bi-image text-muted" style={{fontSize: "3rem"}}></i>
                              </div>
                            )}
                            <div className="position-absolute top-0 end-0 p-2">
                              <span className="badge bg-primary">{index + 1}</span>
                            </div>
                          </div>
                          <div className="card-body">
                            {/* Campo para subir archivo */}
                            <div className="mb-2">
                              <input
                                type="file"
                                className="form-control form-control-sm"
                                onChange={(e) => e.target.files?.[0] && actualizarImagen(imagen.id, 'imagen_file', e.target.files[0])}
                                accept="image/*"
                              />
                            </div>
                            
                            <div className="mb-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Título (opcional)"
                                value={imagen.titulo || ''}
                                onChange={(e) => actualizarImagen(imagen.id, 'titulo', e.target.value)}
                              />
                            </div>
                            
                            <div className="d-flex justify-content-between">
                              <button 
                                type="button" 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => eliminarImagen(imagen.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                              
                              <div>
                                {index > 0 && (
                                  <button 
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm me-1"
                                    onClick={() => {
                                      const nuevasImagenes = Array.from(imagenes);
                                      [nuevasImagenes[index], nuevasImagenes[index - 1]] = 
                                      [nuevasImagenes[index - 1], nuevasImagenes[index]];
                                      reordenarImagenes({
                                        source: { index },
                                        destination: { index: index - 1 }
                                      });
                                    }}
                                  >
                                    <i className="bi bi-arrow-up"></i>
                                  </button>
                                )}
                                
                                {index < imagenes.length - 1 && (
                                  <button 
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                      const nuevasImagenes = Array.from(imagenes);
                                      [nuevasImagenes[index], nuevasImagenes[index + 1]] = 
                                      [nuevasImagenes[index + 1], nuevasImagenes[index]];
                                      reordenarImagenes({
                                        source: { index },
                                        destination: { index: index + 1 }
                                      });
                                    }}
                                  >
                                    <i className="bi bi-arrow-down"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => { limpiarForm(); setMostrandoForm(false); }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-4" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', borderRadius: '12px', padding: '0' }}>
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-1 text-white fw-bold">
                <i className="bi bi-box-seam me-2"></i>Lista de Productos
              </h4>
              <p className="mb-0 text-white-50 small">
                Gestiona y visualiza todos los productos de tu inventario
              </p>
            </div>
            <div className="text-white">
              <i className="bi bi-grid-3x3-gap-fill fs-1 opacity-25"></i>
            </div>
          </div>
          
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 px-3"
                  placeholder="Buscar productos, proveedores, marcas o categorías..."
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  style={{ fontSize: '0.95rem' }}
                />
                {busqueda && (
                  <button 
                    className="btn btn-light border-0" 
                    type="button"
                    onClick={limpiarBusqueda}
                    title="Limpiar búsqueda"
                  >
                    <i className="bi bi-x-lg text-muted"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-end">
                <div className="bg-white bg-opacity-20 rounded-pill px-3 py-2 d-inline-flex align-items-center">
                  <i className="bi bi-collection me-2 text-dark"></i>
                  <span className="text-dark fw-semibold">
                    {busqueda ? (
                      `${productosFiltrados.length} de ${productos.length} productos`
                    ) : (
                      `${productos.length} producto${productos.length !== 1 ? 's' : ''} total${productos.length !== 1 ? 'es' : ''}`
                    )}
                  </span>
                </div>
                {productosFiltrados.length > productosPorPagina && (
                  <div className="mt-2">
                    <small className="text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                      Página {paginaActual} de {totalPaginas}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3 shadow-sm border-0" style={{ overflow: 'hidden' }}>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando productos...</p>
            </div>
          ) : productosActuales.length === 0 ? (
            <div className="alert alert-info">
              {busqueda ? 
                `No se encontraron productos que coincidan con "${busqueda}"` : 
                'No hay productos registrados.'
              }
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: '1rem' }}>
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: '20%', minWidth: '200px' }} className="align-middle">
                        <i className="bi bi-box-seam me-2"></i>Producto
                      </th>
                      <th style={{ width: '12%' }} className="text-center align-middle">
                        <i className="bi bi-cash-stack me-2"></i>Costo
                      </th>
                      <th style={{ width: '10%' }} className="text-center align-middle">
                        <i className="bi bi-percent me-2"></i>Ganancia
                      </th>
                      <th style={{ width: '12%' }} className="text-center align-middle">
                        <i className="bi bi-currency-dollar me-2"></i>Venta
                      </th>
                      <th style={{ width: '12%' }} className="text-center align-middle">
                        <i className="bi bi-calculator me-2"></i>Por Unidad / 100g/ml
                      </th>
                      <th style={{ width: '12%' }} className="align-middle">
                        <i className="bi bi-truck me-2"></i>Proveedor
                      </th>
                      <th style={{ width: '10%' }} className="align-middle">
                        <i className="bi bi-clock me-2"></i>Última Modificación
                      </th>
                      <th style={{ width: '8%' }} className="text-center align-middle">
                        <i className="bi bi-check-circle me-2"></i>Estado
                      </th>
                      <th style={{ width: '4%' }} className="text-center align-middle">
                        <i className="bi bi-gear-fill"></i>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosActuales.map(producto => {
                      const precioFraccionado = calcularPrecioFraccionado(producto);
                      
                        return (
                        <tr key={producto.id} style={{ borderLeft: '4px solid #28a745' }}>
                          <td>
                            <div className="d-flex align-items-start">
                              <div className="me-3">
                                <div 
                                  className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: '40px', height: '40px', minWidth: '40px' }}
                                >
                                  <i className="bi bi-box text-muted"></i>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold" style={{ fontSize: '1.05rem', lineHeight: '1.2' }}>
                                  {producto.nombre}
                                </h6>
                                {producto.marca && (
                                  <div className="text-primary mb-1" style={{ fontSize: '1rem', fontWeight: '700' }}>
                                    <i className="bi bi-award me-1"></i>
                                    {producto.marca}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span className="text-muted small">Costo</span>
                              <span className="fw-semibold text-dark" style={{ fontSize: '1rem' }}>
                                {formatearPrecio(producto.precio_costo || 0)}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span className="text-muted small">Margen</span>
                              <span 
                                className="badge px-2 py-1"
                                style={{
                                  backgroundColor: '#fff3cd',
                                  color: '#856404',
                                  border: '1px solid #ffeaa7',
                                  fontSize: '0.85rem'
                                }}
                              >
                                {formatearPorcentaje(producto.porcentaje_ganancia)}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span className="text-muted small">Precio</span>
                              <span className="fw-bold" style={{ color: '#28a745', fontSize: '1.1rem' }}>
                                {formatearPrecio(producto.precio_venta_publico || 0)}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span className="fw-semibold" style={{ color: '#28a745', fontSize: '1rem' }}>
                                {precioFraccionado.precio}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                {precioFraccionado.unidad}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-building text-muted me-2"></i>
                              <span style={{ fontSize: '0.95rem' }}>{producto.proveedor}</span>
                            </div>
                          </td>
                          <td>
                            <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                              {producto.fecha_ultima_modificacion ? 
                                new Date(producto.fecha_ultima_modificacion).toLocaleString('es-AR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 
                                'No disponible'
                              }
                            </small>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              {producto.disponible ? (
                                <>
                                  <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                  <small className="text-success fw-semibold">Disponible</small>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                                  <small className="text-danger fw-semibold">No disponible</small>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column gap-1">
                              <button 
                                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                                onClick={() => editarProducto(producto)}
                                style={{ fontSize: '0.8rem', padding: '6px 12px', minWidth: '90px' }}
                                title="Editar producto"
                              >
                                <i className="bi bi-pencil-square me-1"></i>
                                Editar
                              </button>
                              <button 
                                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                                onClick={() => borrarProducto(producto.id)}
                                style={{ fontSize: '0.8rem', padding: '6px 12px', minWidth: '90px' }}
                                title="Eliminar producto"
                              >
                                <i className="bi bi-trash3 me-1"></i>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
                  <nav>
                    <ul className="pagination pagination-sm mb-0" style={{ gap: '2px' }}>
                      {/* Botón anterior */}
                      <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          style={{ 
                            borderColor: '#28a745',
                            color: paginaActual === 1 ? '#6c757d' : '#28a745',
                            backgroundColor: 'white',
                            padding: '6px 10px',
                            fontSize: '0.875rem',
                            borderRadius: '6px'
                          }}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>

                      {/* Primera página y puntos suspensivos si es necesario */}
                      {paginaActual > 3 && totalPaginas > 5 && (
                        <>
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={() => cambiarPagina(1)}
                              style={{ 
                                borderColor: '#28a745', 
                                color: '#28a745',
                                backgroundColor: 'white',
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                minWidth: '36px'
                              }}
                            >
                              1
                            </button>
                          </li>
                          <li className="page-item disabled">
                            <span 
                              className="page-link" 
                              style={{ 
                                borderColor: '#28a745', 
                                color: '#6c757d',
                                backgroundColor: 'white',
                                padding: '6px 8px',
                                fontSize: '0.875rem',
                                borderRadius: '6px'
                              }}
                            >
                              ...
                            </span>
                          </li>
                        </>
                      )}

                      {/* Números de página */}
                      {(() => {
                        const startPage = Math.max(1, paginaActual - 2);
                        const endPage = Math.min(totalPaginas, paginaActual + 2);
                        const pages = [];
                        
                        for (let i = startPage; i <= endPage; i++) {
                          const isActive = i === paginaActual;
                          pages.push(
                            <li key={i} className="page-item">
                              <button
                                className="page-link"
                                onClick={() => cambiarPagina(i)}
                                style={{
                                  borderColor: '#28a745',
                                  backgroundColor: isActive ? '#28a745' : 'white',
                                  color: isActive ? 'white' : '#28a745',
                                  padding: '6px 12px',
                                  fontSize: '0.875rem',
                                  borderRadius: '6px',
                                  minWidth: '36px',
                                  fontWeight: isActive ? '600' : '500'
                                }}
                              >
                                {i}
                              </button>
                            </li>
                          );
                        }
                        return pages;
                      })()}

                      {/* Puntos suspensivos y última página si es necesario */}
                      {paginaActual < totalPaginas - 2 && totalPaginas > 5 && (
                        <>
                          <li className="page-item disabled">
                            <span 
                              className="page-link" 
                              style={{ 
                                borderColor: '#28a745', 
                                color: '#6c757d',
                                backgroundColor: 'white',
                                padding: '6px 8px',
                                fontSize: '0.875rem',
                                borderRadius: '6px'
                              }}
                            >
                              ...
                            </span>
                          </li>
                          <li className="page-item">
                            <button
                              className="page-link"
                              onClick={() => cambiarPagina(totalPaginas)}
                              style={{ 
                                borderColor: '#28a745', 
                                color: '#28a745',
                                backgroundColor: 'white',
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                minWidth: '36px'
                              }}
                            >
                              {totalPaginas}
                            </button>
                          </li>
                        </>
                      )}

                      {/* Botón siguiente */}
                      <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => cambiarPagina(paginaActual + 1)}
                          disabled={paginaActual === totalPaginas}
                          style={{ 
                            borderColor: '#28a745',
                            color: paginaActual === totalPaginas ? '#6c757d' : '#28a745',
                            backgroundColor: 'white',
                            padding: '6px 10px',
                            fontSize: '0.875rem',
                            borderRadius: '6px'
                          }}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                  
                  {/* Texto de página actual */}
                  <small className="text-muted ms-3">
                    Página {paginaActual} de {totalPaginas}
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductosABMC;