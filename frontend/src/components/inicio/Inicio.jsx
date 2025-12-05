import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../banners/BannerCarousel';
import '../../styles/Inicio.css';
import React from 'react';

function Inicio() {
    const navigate = useNavigate();
    return (
        <>
            {/* Carrusel de banners promocionales */}
            <div className="container-fluid">
                <BannerCarousel />
            </div>

            {/* Contenido principal */}
      <header className="bg-light text-center py-5">
        <h1 className="display-4">¡Bienvenido a nuestra tienda natural!</h1>
        <p className="lead">Productos saludables, orgánicos y al mejor precio</p>
        <button className="btn btn-success btn-lg mt-3" onClick={() => navigate('/tienda')}>
          Ir a la Tienda
        </button>
      </header>

      <section className="container text-center my-5">
        <h2>¿Qué ofrecemos?</h2>
        <p>Semillas, cereales, frutos secos, productos sin TACC y más.</p>
      </section>
        </>
    );
}


export default Inicio;
