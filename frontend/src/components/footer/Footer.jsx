import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaPhone, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaInstagram, FaFacebook } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer 
      id="contacto"
      style={{
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        marginTop: 'auto',
        paddingTop: '60px',
        paddingBottom: '40px'
      }}
    >
      <Container>
        <Row className="gy-4">
          {/* Información de Contacto */}
          <Col lg={4} md={6}>
            <div className="mb-4">
              <img 
                src="/logos/DN_logo_white_text_v4.svg" 
                alt="Delicias Naturales" 
                height="50" 
                className="mb-3"
              />
              <h5 
                style={{ 
                  color: '#4CAF50',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  marginBottom: '20px'
                }}
              >
                Información de Contacto
              </h5>
            </div>
            
            <div className="contact-info">
              <div className="d-flex align-items-center mb-3">
                <FaMapMarkerAlt 
                  style={{ 
                    color: '#4CAF50', 
                    fontSize: '1.1rem',
                    marginRight: '12px',
                    minWidth: '20px'
                  }} 
                />
                <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                  Arroyito, Córdoba<br />
                  <small style={{ color: '#cccccc' }}>Córdoba, Argentina</small>
                </span>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <FaPhone 
                  style={{ 
                    color: '#4CAF50', 
                    fontSize: '1rem',
                    marginRight: '12px',
                    minWidth: '20px'
                  }} 
                />
                <a 
                  href="tel:+5493516123456"
                  style={{ 
                    color: '#ffffff', 
                    textDecoration: 'none',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  (03576) 454952
                </a>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <FaEnvelope 
                  style={{ 
                    color: '#4CAF50', 
                    fontSize: '1rem',
                    marginRight: '12px',
                    minWidth: '20px'
                  }} 
                />
                <a 
                  href="mailto:info@deliciasnaturales.com.ar"
                  style={{ 
                    color: '#ffffff', 
                    textDecoration: 'none',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  jorgeosvaldoesposito@gmail.com
                </a>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <FaWhatsapp 
                  style={{ 
                    color: '#25D366', 
                    fontSize: '1.1rem',
                    marginRight: '12px',
                    minWidth: '20px'
                  }} 
                />
                <a 
                  href="https://wa.me/5493576650997?text=Hola%2C%20quiero%20información%20sobre%20sus%20productos."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#ffffff', 
                    textDecoration: 'none',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#25D366'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  +54 9 3576 65-0997
                </a>
              </div>
            </div>
          </Col>

          {/* Horarios de Atención */}
          <Col lg={3} md={6}>
            <h5 
              style={{ 
                color: '#4CAF50',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '20px'
              }}
            >
              Horarios de Atención
            </h5>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <div className="mb-2">
                <strong style={{ color: '#ffffff' }}>Lunes a Viernes:</strong><br />
                <span style={{ color: '#cccccc' }}>9:00 a 12:30 y 17:00 a 21:00</span>
              </div>
              <div className="mb-2">
                <strong style={{ color: '#ffffff' }}>Sábados:</strong><br />
                <span style={{ color: '#cccccc' }}>9:30 a 12:30 y 17:00 a 21:00</span>
              </div>
              <div className="mb-2">
                <strong style={{ color: '#ffffff' }}>Domingos:</strong><br />
                <span style={{ color: '#cccccc' }}>Cerrado</span>
              </div>
              <div className="mt-3" style={{ fontSize: '0.85rem', color: '#999999' }}>
                <em>* Horarios sujetos a modificación en feriados</em>
              </div>
            </div>
          </Col>

          {/* Enlaces Útiles */}
          <Col lg={2} md={6}>
            <h5 
              style={{ 
                color: '#4CAF50',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '20px'
              }}
            >
              Enlaces Útiles
            </h5>
            <ul style={{ listStyle: 'none', padding: '0', fontSize: '0.9rem' }}>
              <li className="mb-2">
                <a 
                  href="/tienda"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Nuestra Tienda
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/productos-organicos"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Productos Orgánicos
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/sobre-nosotros"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Sobre Nosotros
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/preguntas-frecuentes"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </Col>

          {/* Políticas y Redes Sociales */}
          <Col lg={3} md={6}>
            <h5 
              style={{ 
                color: '#4CAF50',
                fontSize: '1.2rem',
                fontWeight: '600',
                marginBottom: '20px'
              }}
            >
              Políticas y Redes
            </h5>
            
            <ul style={{ listStyle: 'none', padding: '0', fontSize: '0.9rem' }}>
              <li className="mb-2">
                <a 
                  href="/terminos-y-condiciones"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Términos y Condiciones
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/politicas-de-privacidad"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Políticas de Privacidad
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/politicas-de-devolucion"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Políticas de Devolución
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="/envios-y-entregas"
                  style={{ 
                    color: '#cccccc', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4CAF50'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                >
                  Envíos y Entregas
                </a>
              </li>
            </ul>

            {/* Redes Sociales */}
            <div className="mt-4">
              <h6 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '15px' }}>
                Síguenos en:
              </h6>
              <div className="d-flex gap-3">
                <a 
                  href="https://instagram.com/deliciasnaturales"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#cccccc',
                    fontSize: '1.5rem',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#E4405F'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                  title="Instagram"
                >
                  <FaInstagram />
                </a>
                <a 
                  href="https://facebook.com/deliciasnaturales"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#cccccc',
                    fontSize: '1.5rem',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#1877F2'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                  title="Facebook"
                >
                  <FaFacebook />
                </a>
                <a 
                  href="https://wa.me/5493576650997"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#cccccc',
                    fontSize: '1.5rem',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#25D366'}
                  onMouseLeave={(e) => e.target.style.color = '#cccccc'}
                  title="WhatsApp"
                >
                  <FaWhatsapp />
                </a>
              </div>
            </div>
          </Col>
        </Row>

        {/* Línea separadora */}
        <hr 
          style={{ 
            borderColor: '#333333', 
            margin: '40px 0 30px 0' 
          }} 
        />

        {/* Copyright */}
        <Row>
          <Col className="text-center">
            <div style={{ fontSize: '0.9rem', color: '#999999' }}>
              <p className="mb-2">
                © {new Date().getFullYear()} <strong style={{ color: '#4CAF50' }}>Delicias Naturales</strong>. 
                Todos los derechos reservados.
              </p>
              <p className="mb-0" style={{ fontSize: '0.8rem' }}>
                Productos naturales y orgánicos de la mejor calidad | Córdoba, Argentina
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
