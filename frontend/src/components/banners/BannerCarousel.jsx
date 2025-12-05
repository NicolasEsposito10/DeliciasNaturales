import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState('next'); // Tracking direction of slide

  useEffect(() => {
    axios.get('/api/banners')
      .then(res => {
        setBanners(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando banners:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Autorotación cada 5 segundos si hay más de un banner
    if (banners.length > 1) {
      const interval = setInterval(() => {
        // Siempre moverse hacia la derecha (next slide)
        setDirection('next');
        setActiveIndex(current => (current + 1) % banners.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const goToSlide = (index) => {
    // Determinar la dirección basada en el índice actual vs el nuevo
    if (index > activeIndex || (activeIndex === banners.length - 1 && index === 0)) {
      setDirection('next');
    } else {
      setDirection('prev');
    }
    setActiveIndex(index);
  };

  const goToPrevSlide = () => {
    setDirection('prev');
    setActiveIndex((activeIndex - 1 + banners.length) % banners.length);
  };

  const goToNextSlide = () => {
    setDirection('next');
    setActiveIndex((activeIndex + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null; // No mostrar nada si no hay banners
  }

  return (
    <div className="banner-carousel mb-4">
      <div id="promocionCarousel" className={`carousel slide carousel-${direction}`} data-bs-ride="carousel">
        <div className="carousel-indicators">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              data-bs-target="#promocionCarousel"
              data-bs-slide-to={index}
              className={`rounded-circle ${index === activeIndex ? "active" : ""}`}
              aria-current={index === activeIndex ? "true" : "false"}
              aria-label={`Slide ${index + 1}`}
              onClick={() => goToSlide(index)}
              style={{ 
                width: '12px', 
                height: '12px', 
                margin: '0 5px',
                backgroundColor: index === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            ></button>
          ))}
        </div>
        <div className="carousel-inner rounded" 
             style={{ 
               boxShadow: `0 4px 8px ${banners[activeIndex]?.color_borde || 'rgba(0,0,0,0.2)'}`
             }}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`carousel-item ${index === activeIndex ? "active" : ""}`}
            >
              {banner.url_link ? (
                <a href={banner.url_link} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={banner.es_url ? banner.url_imagen : `data:image/jpeg;base64,${banner.imagen_base64}`} 
                    className="d-block w-100" 
                    alt={banner.titulo}
                    style={{ height: '300px', objectFit: 'cover' }}
                  />
                </a>
              ) : (
                <img 
                  src={banner.es_url ? banner.url_imagen : `data:image/jpeg;base64,${banner.imagen_base64}`} 
                  className="d-block w-100" 
                  alt={banner.titulo}
                  style={{ height: '300px', objectFit: 'cover' }}
                />
              )}
              {(banner.titulo || banner.descripcion) && (
                <div className="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">
                  {banner.titulo && <h5>{banner.titulo}</h5>}
                  {banner.descripcion && <p>{banner.descripcion}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        {banners.length > 1 && (
          <>
            <button className="carousel-control-prev" type="button" onClick={goToPrevSlide}>
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Anterior</span>
            </button>
            <button className="carousel-control-next" type="button" onClick={goToNextSlide}>
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Siguiente</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default BannerCarousel;
