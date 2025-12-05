import React, { useState } from 'react';

const FiltroLateral = ({ marcas = [], onFiltrar }) => {
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [orden, setOrden] = useState('nombre-asc');
  const [porUnidad, setPorUnidad] = useState(false);
  const [porFraccion, setPorFraccion] = useState(false);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState([]);

  const handleMarcaChange = (marca) => {
    setMarcasSeleccionadas((prev) =>
      prev.includes(marca)
        ? prev.filter((m) => m !== marca)
        : [...prev, marca]
    );
  };

  const handleFiltrar = () => {
    onFiltrar && onFiltrar({
      precioMin,
      precioMax,
      orden,
      porUnidad,
      porFraccion,
      marcas: marcasSeleccionadas
    });
  };

  // Llama a handleFiltrar cada vez que cambia un filtro
  React.useEffect(() => {
    handleFiltrar();
    // eslint-disable-next-line
  }, [precioMin, precioMax, orden, porUnidad, porFraccion, marcasSeleccionadas]);

  return (
    <aside className="filtro-lateral p-3 bg-white rounded shadow-sm" style={{ minWidth: 260, maxWidth: 320 }}>
      <h5 className="mb-4" style={{ color: '#28ad10', fontWeight: 700 }}>Filtrar productos</h5>
      <div className="mb-4">
        <label className="form-label fw-bold">Precio</label>
        <div className="d-flex gap-2">
          <input type="number" className="form-control" placeholder="Mínimo" value={precioMin} min={0} onChange={e => setPrecioMin(e.target.value)} />
          <input type="number" className="form-control" placeholder="Máximo" value={precioMax} min={0} onChange={e => setPrecioMax(e.target.value)} />
        </div>
      </div>
      <div className="mb-4">
        <label className="form-label fw-bold">Ordenar por</label>
        <select className="form-select" value={orden} onChange={e => setOrden(e.target.value)}>
          <option value="nombre-asc">Nombre (A-Z)</option>
          <option value="nombre-desc">Nombre (Z-A)</option>
          <option value="precio-asc">Precio (menor a mayor)</option>
          <option value="precio-desc">Precio (mayor a menor)</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="form-label fw-bold">Tipo de venta</label>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="porUnidad" checked={porUnidad} onChange={e => setPorUnidad(e.target.checked)} />
          <label className="form-check-label" htmlFor="porUnidad">Por unidad</label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="porFraccion" checked={porFraccion} onChange={e => setPorFraccion(e.target.checked)} />
          <label className="form-check-label" htmlFor="porFraccion">Por fracción</label>
        </div>
      </div>
      <div className="mb-4">
        <label className="form-label fw-bold">Marca</label>
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {marcas.length === 0 && <div className="text-muted">No hay marcas</div>}
          {marcas.map((marca) => (
            <div className="form-check" key={marca}>
              <input className="form-check-input" type="checkbox" id={`marca-${marca}`} checked={marcasSeleccionadas.includes(marca)} onChange={() => handleMarcaChange(marca)} />
              <label className="form-check-label" htmlFor={`marca-${marca}`}>{marca}</label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default FiltroLateral;
