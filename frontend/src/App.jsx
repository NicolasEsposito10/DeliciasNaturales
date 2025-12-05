import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CarritoProvider, useCarrito } from './context/CarritoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { FaShoppingCart, FaUser, FaHome } from 'react-icons/fa';
import axios from 'axios';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import Inicio from './components/inicio/Inicio';
import Login from './components/login/LoginFixed';
import Registro from './components/registro/Registro';
import RecuperarPassword from './components/login/RecuperarPassword';
import Perfil from './components/perfil/Perfil2';
import PrivateRoute from './components/perfil/PrivateRoute';
import BannerCarousel from './components/banners/BannerCarousel';
import VistaProductos from './components/tienda/VistaProductos';
import Carrito from './components/carrito/Carrito';
import BannerAdmin from './components/banners/BannerAdmin';
import ProductosABMC from './components/administracion/productos/ProductosABMC';
import CategoriasAdmin from './components/administracion/CategoriasAdmin';
import CategoriaDetalle from './components/administracion/CategoriaDetalle';
import MarcasAdmin from './components/administracion/MarcasAdmin';
import ProveedoresAdmin from './components/administracion/ProveedoresAdmin';
import UnidadesAdmin from './components/administracion/UnidadesAdmin';
import EtiquetasAdmin from './components/administracion/EtiquetasAdmin';
import AdminRoute from './components/perfil/AdminRoute';
import AdminDashboard from './components/administracion/AdminDashboard';
import AdminUsuarios from './components/administracion/AdminUsuarios';
import PedidosAdmin from './components/administracion/PedidosAdmin';
import ImportarProductos from './components/administracion/ImportarProductos';
import ProductoDetalle from './components/producto/ProductoDetalle';
import WishlistDropdown from './components/wishlist/WishlistDropdown';
import Wishlist from './components/wishlist/Wishlist';
import Footer from './components/footer/Footer';
import ProductSearchDropdown from './components/busqueda/ProductSearchDropdown';

// Componente Navbar separado para poder acceder al contexto del carrito
function NavBar() {
  const { items } = useCarrito();
  const { isAdmin, isAuthenticated, user, logout } = useAuth();
  const cantidadItems = items.reduce((acc, item) => acc + (item.cantidad || 1), 0);
  const navigate = useNavigate();
  const location = useLocation();
  const isPerfilPage = location.pathname === '/perfil';
  const isInicioPage = location.pathname === '/inicio';

  // Debug: Verificar estado de autenticación
  useEffect(() => {
    console.log('🔍 NavBar - Estado de autenticación:', {
      isAuthenticated: isAuthenticated(),
      isAdmin: isAdmin(),
      user: user,
      token: localStorage.getItem('token')
    });
  }, [isAuthenticated, isAdmin, user, location.pathname]);

  useEffect(() => {
    // Cargar Bootstrap JS dinámicamente
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Manejar hover para mostrar dropdown
  const handleMouseEnter = () => {
    setDropdownOpen(true);
  };

  // Manejar salida del mouse para ocultar dropdown
  const handleMouseLeave = () => {
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    console.log('🚪 Logout desde navbar');
    logout();
    navigate('/login');
  };

  const handleContactoClick = () => {
    // Si no estamos en la página de inicio, navegar primero
    if (location.pathname !== '/inicio' && location.pathname !== '/') {
      navigate('/inicio');
      // Esperar un poco para que la navegación se complete antes del scroll
      setTimeout(() => {
        const contactoElement = document.getElementById('contacto');
        if (contactoElement) {
          contactoElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      // Si ya estamos en inicio, hacer scroll directamente
      const contactoElement = document.getElementById('contacto');
      if (contactoElement) {
        contactoElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <nav className="navbar-custom d-flex justify-content-between align-items-center px-3 px-lg-5 py-3 flex-wrap">
      {/* Logo o Título */}
      <div className="navbar-logo">
        <Link to="/" className="navbar-brand mb-0 d-flex align-items-center text-decoration-none">
          <img 
            src="/logos/DN_logo_white_text_v4.svg" 
            alt="Delicias Naturales Logo" 
            height="40" 
            className="me-2"
          />
        </Link>
      </div>

      {/* Container para centrar contenido */}
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {/* Links centrales */}
        <div className="navbar-links d-flex gap-2 gap-lg-4 flex-wrap">
          <span className="navbar-link" onClick={() => navigate('/')}>
            PÁGINA PRINCIPAL
          </span>
          <span className="navbar-link" onClick={() => navigate('/tienda')}>
            TIENDA
          </span>
          <span className="navbar-link" onClick={handleContactoClick}>
            CONTACTO
          </span>
          {/* Mostrar menú de administración SOLO si está autenticado Y es admin */}
          {isAuthenticated() && isAdmin() && (
            <div 
              className="dropdown position-relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span 
                className="navbar-link" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/administrar')}
              >
                ADMINISTRAR

              </span>
              {dropdownOpen && (
                <div 
                  className="dropdown-menu show position-absolute bg-white border rounded shadow-lg"
                  style={{ 
                    top: '100%', 
                    left: '0',
                    minWidth: '200px',
                    zIndex: 1050,
                    marginTop: '5px'
                  }}
                >
                  <Link 
                    to="/administrar/productos" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Productos
                  </Link>
                  <Link 
                    to="/administrar/pedidos" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Pedidos
                  </Link>
                  <Link 
                    to="/administrar/promociones" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Promociones
                  </Link>
                  <div className="dropdown-divider mx-2"></div>
                  <Link 
                    to="/administrar/proveedores" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Proveedores
                  </Link>
                  <Link 
                    to="/administrar/categorias" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Categorías
                  </Link>
                  <Link 
                    to="/administrar/etiquetas" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Etiquetas
                  </Link>
                  <Link 
                    to="/administrar/marcas" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Marcas
                  </Link>
                  <Link 
                    to="/administrar/unidades" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Unidades
                  </Link>
                  <div className="dropdown-divider mx-2"></div>
                  <Link 
                    to="/administrar/usuarios" 
                    className="dropdown-item px-3 py-2 text-decoration-none text-dark"
                    style={{ display: 'block' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Usuarios
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buscador de productos */}
        <div className="navbar-search d-none d-lg-block">
          <ProductSearchDropdown />
        </div>
      </div>

      {/* Iconos del lado derecho */}
      <div className="navbar-icons d-flex gap-3">
        {/* Wishlist Dropdown */}
        <WishlistDropdown />
        
        {/* Lógica condicional para los iconos */}
        {isPerfilPage ? (
          // Solo casita cuando está en /perfil
          <button
            className="icon-button"
            onClick={() => navigate('/inicio')}
            title="Ir a Inicio"
          >
            <FaHome />
          </button>
        ) : isInicioPage ? (
          // Solo perfil cuando está en /inicio
          <button
            className="icon-button"
            onClick={() => {
              console.log('🔍 Click en perfil - Estado auth:', {
                isAuthenticated: isAuthenticated(),
                token: localStorage.getItem('token')
              });
              navigate('/perfil');
            }}
            title="Ir a Perfil"
          >
            <FaUser />
          </button>
        ) : (
          // Ambos iconos cuando está en otras rutas
          <>
            <button
              className="icon-button"
              onClick={() => navigate('/inicio')}
              title="Ir a Inicio"
            >
              <FaHome />
            </button>
            <button
              className="icon-button"
              onClick={() => {
                console.log('🔍 Click en perfil - Estado auth:', {
                  isAuthenticated: isAuthenticated(),
                  token: localStorage.getItem('token')
                });
                navigate('/perfil');
              }}
              title="Ir a Perfil"
            >
              <FaUser />
            </button>
          </>
        )}
        
        {/* Carrito al final */}
        <button
          className="icon-button position-relative"
          onClick={() => navigate('/carrito')}
          title="Ir a Carrito"
        >
          <FaShoppingCart />
          {cantidadItems > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {cantidadItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <WishlistProvider>
          <Router>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <NavBar />
              <main style={{ flex: '1' }}>
                <Routes>
            {/* Redirección de la raíz a /inicio */}
            <Route path="/" element={<Navigate to="/inicio" replace />} />

            {/* Rutas principales */}
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/tienda" element={<VistaProductos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registro />} />
            <Route path="/recuperar-contraseña" element={<RecuperarPassword />} />
            <Route
              path="/perfil"
              element={
                <PrivateRoute>
                  <Perfil />
                </PrivateRoute>
              }
            />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/wishlist" element={<Wishlist />} />
            
            {/* Rutas de la tienda */}
            <Route path="/tienda/:nombreCategoria" element={<CategoriaDetalle />} />
            <Route path="/producto/:nombreProducto" element={<ProductoDetalle />} />

            {/* Rutas de administración - Protegidas para admin únicamente */}
            <Route 
              path="/administrar" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/productos" 
              element={
                <AdminRoute>
                  <ProductosABMC />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/promociones" 
              element={
                <AdminRoute>
                  <BannerAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/proveedores" 
              element={
                <AdminRoute>
                  <ProveedoresAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/categorias" 
              element={
                <AdminRoute>
                  <CategoriasAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/etiquetas" 
              element={
                <AdminRoute>
                  <EtiquetasAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/marcas" 
              element={
                <AdminRoute>
                  <MarcasAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/unidades" 
              element={
                <AdminRoute>
                  <UnidadesAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/usuarios" 
              element={
                <AdminRoute>
                  <AdminUsuarios />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/pedidos" 
              element={
                <AdminRoute>
                  <PedidosAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/administrar/importar" 
              element={
                <AdminRoute>
                  <ImportarProductos />
                </AdminRoute>
              } 
            />
            
            {/* Ruta catch-all para cualquier URL de administración no especificada */}
            <Route 
              path="/administrar/*" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            
            {/* Redirecciones para mantener compatibilidad */}
            <Route path="/admin" element={<Navigate to="/administrar/productos" replace />} />
            <Route path="/admin/banners" element={<Navigate to="/administrar/promociones" replace />} />
            <Route path="/admin/productos" element={<Navigate to="/administrar/productos" replace />} />
            <Route path="/admin/categorias" element={<Navigate to="/administrar/categorias" replace />} />
            <Route path="/admin/marcas" element={<Navigate to="/administrar/marcas" replace />} />
            <Route path="/admin/proveedores" element={<Navigate to="/administrar/proveedores" replace />} />
            <Route path="/admin/unidades" element={<Navigate to="/administrar/unidades" replace />} />
            <Route path="/admin/etiquetas" element={<Navigate to="/administrar/etiquetas" replace />} />
          </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </WishlistProvider>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;