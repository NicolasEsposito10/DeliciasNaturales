import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import CategoriaDetalle from "./CategoriaDetalle";

function CategoriasAdmin() {
  const location = useLocation();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  // Detectar si se debe abrir el formulario automáticamente
  useEffect(() => {
    if (location.state?.abrirFormulario) {
      limpiarFormulario();
      setFormVisible(true);
      // Limpiar el state para evitar que se abra de nuevo al navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const cargarCategorias = () => {
    setLoading(true);
    axios
      .get("/api/categorias")
      .then((res) => {
        setCategorias(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando categorías:", err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editando) {
      axios
        .put(`/api/categorias/${formData.id}`, formData)
        .then(() => {
          cargarCategorias();
          setFormVisible(false);
          limpiarFormulario();
          alert("Categoría actualizada exitosamente");
        })
        .catch((err) => {
          console.error("Error actualizando categoría:", err);
          alert("Error al actualizar la categoría");
        });
    } else {
      axios
        .post("/api/categorias", formData)
        .then(() => {
          cargarCategorias();
          setFormVisible(false);
          limpiarFormulario();
          alert("Categoría creada exitosamente");
        })
        .catch((err) => {
          console.error("Error creando categoría:", err);
          alert("Error al crear la categoría");
        });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const editarCategoria = (categoria) => {
    setFormData(categoria);
    setEditando(true);
    setFormVisible(true);
  };

  const borrarCategoria = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta categoría?")) {
      axios
        .delete(`/api/categorias/${id}`)
        .then(() => {
          cargarCategorias();
          alert("Categoría eliminada exitosamente");
        })
        .catch((err) => {
          console.error("Error eliminando categoría:", err);
          alert("Error al eliminar la categoría");
        });
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      id: "",
      nombre: "",
    });
    setEditando(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Administración de Categorías</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            limpiarFormulario();
            setFormVisible(true);
          }}
        >
          <i className="bi bi-plus-circle"></i> Nueva Categoría
        </button>
      </div>

      {formVisible && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">
              {editando ? "Editar Categoría" : "Crear Categoría"}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={formData.nombre || ""}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Lácteos, Frutos Secos, etc."
                />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editando ? "Actualizar" : "Guardar"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setFormVisible(false);
                    limpiarFormulario();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-light">
          <h5 className="m-0">Categorías existentes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : categorias.length === 0 ? (
            <div className="alert alert-info">
              No hay categorías registradas. Crea una nueva.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>{categoria.id}</td>
                      <td>
                        <strong>{categoria.nombre}</strong>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => editarCategoria(categoria)}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => borrarCategoria(categoria.id)}
                          >
                            <i className="bi bi-trash"></i> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoriasAdmin;
