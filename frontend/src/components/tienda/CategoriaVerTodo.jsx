import React, { useState, useEffect } from 'react';
import FiltroLateral from './FiltroLateral';

// Simulación de fetch de productos y marcas (reemplaza por tu API real)
const fetchProductosYMarcas = async (categoria) => {
  // Aquí deberías hacer un fetch real a tu backend
  // Este es un ejemplo de estructura de datos
  return {
    productos: [
      // ...
    ],
    marcas: ['Funko', 'Playmobil', 'Genérica', 'Hasbro', 'Barbie', 'Mattel', 'Wabro', 'Ditoys', 'Caffaro']
  };
};

const CategoriaVerTodo = ({ categoria }) => {
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  useEffect(() => {
    fetchProductosYMarcas(categoria).then(({ productos, marcas }) => {
      setProductos(productos);
      setMarcas(marcas);
      setProductosFiltrados(productos);
    });
  }, [categoria]);

  useEffect(() => {
    let filtrados = [...productos];
    // Filtrar por precio
    if (filtros.precioMin) filtrados = filtrados.filter(p => p.precio >= Number(filtros.precioMin));
    if (filtros.precioMax) filtrados = filtrados.filter(p => p.precio <= Number(filtros.precioMax));
    // Filtrar por tipo de venta
    if (filtros.porUnidad && !filtros.porFraccion) filtrados = filtrados.filter(p => p.tipo_venta === 'unidad');
    if (!filtros.porUnidad && filtros.porFraccion) filtrados = filtrados.filter(p => p.tipo_venta === 'fraccion');
    // Filtrar por marcas
    if (filtros.marcas && filtros.marcas.length > 0) filtrados = filtrados.filter(p => filtros.marcas.includes(p.marca));
    // Ordenar
    if (filtros.orden === 'nombre-asc') filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (filtros.orden === 'nombre-desc') filtrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
    if (filtros.orden === 'precio-asc') filtrados.sort((a, b) => a.precio - b.precio);
    if (filtros.orden === 'precio-desc') filtrados.sort((a, b) => b.precio - a.precio);
    setProductosFiltrados(filtrados);
  }, [filtros, productos]);

  return (
    <div className="container-fluid" style={{ background: '#f7f7f7', minHeight: '100vh' }}>
      <div className="row py-4">
        <div className="col-12 col-md-3 mb-4 mb-md-0">
          <FiltroLateral marcas={marcas} onFiltrar={setFiltros} />
        </div>
        <div className="col-12 col-md-9">
          <h2 className="mb-4" style={{ color: '#28ad10', fontWeight: 700 }}>Productos de {categoria}</h2>
          <div className="row g-3">
            {productosFiltrados.length === 0 && (
              <div className="col-12 text-center text-muted py-5">No se encontraron productos con los filtros seleccionados.</div>
            )}
            {productosFiltrados.map(producto => (
              <div className="col-12 col-sm-6 col-lg-4" key={producto.id}>
                {/* Aquí renderiza tu tarjeta de producto */}
                <div className="card h-100 shadow-sm">
                  <img src={producto.imagen_url} className="card-img-top" alt={producto.nombre} />
                  <div className="card-body">
                    <h5 className="card-title">{producto.nombre}</h5>
                    <p className="card-text">Marca: {producto.marca}</p>
                    <p className="card-text fw-bold text-success">${producto.precio.toLocaleString('es-AR')}</p>
                    <span className="badge bg-secondary">{producto.tipo_venta === 'unidad' ? 'Por unidad' : 'Por fracción'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriaVerTodo;
