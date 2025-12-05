import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/recuperarPassword.css';

function RecuperarPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleRecuperacion = async (e) => {
    e.preventDefault();
    
    try {
      // Aquí podrías hacer una llamada al backend para enviar el email
      // const respuesta = await fetch("http://localhost:5000/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email })
      // });
      
      setMensaje("Se ha enviado un enlace de recuperación a tu correo electrónico.");
      setEnviado(true);
      setEmail("");
      
    } catch (error) {
      setMensaje("Error al enviar el correo de recuperación.");
    }
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-card">
        <div>
          <h2 className="recuperar-title">RECUPERAR CONTRASEÑA</h2>
          <p className="recuperar-subtitle">
            {enviado 
              ? "Revisa tu correo electrónico" 
              : "Ingresa tu correo para restablecer tu contraseña"
            }
          </p>
        </div>

        {!enviado ? (
          <form onSubmit={handleRecuperacion}>
            <div className="recuperar-form-group">
              <label className="recuperar-label">CORREO ELECTRÓNICO</label>
              <input
                type="email"
                placeholder="Ingrese su correo"
                className="recuperar-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="recuperar-info">
              <svg width="30" height="30" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
              </svg>
              Te enviaremos un enlace seguro a tu correo electrónico para que puedas crear una nueva contraseña.
            </div>

            <button 
              className="recuperar-btn" 
              type="submit"
            >
              Enviar Enlace de Recuperación
            </button>
          </form>
        ) : (
          <div className="recuperar-success">
            <div className="recuperar-success-icon">
              <svg width="64" height="64" fill="currentColor" className="bi bi-envelope-check" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>
                <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686"/>
              </svg>
            </div>
            
            <h5 className="recuperar-success-title">¡Correo Enviado!</h5>
            
            <div className="recuperar-success-message">
              Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </div>

            <div className="recuperar-help-text">
              <small>
                ¿No recibiste el correo? Revisa tu carpeta de spam o intenta nuevamente en unos minutos.
              </small>
            </div>
          </div>
        )}

        {mensaje && !enviado && (
          <div className="alert alert-info mt-3 text-center" style={{borderRadius: '10px'}}>
            {mensaje}
          </div>
        )}
        
        <div className="recuperar-footer">
          <span>¿Recordaste tu contraseña? </span>
          <button 
            onClick={() => navigate("/login")} 
            className="recuperar-link"
          >
            Inicia sesión
          </button>
        </div>

        {enviado && (
          <div className="text-center">
            <button 
              onClick={() => {
                setEnviado(false);
                setMensaje("");
                setEmail("");
              }}
              className="recuperar-back-btn"
            >
              Enviar a otro correo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecuperarPassword;
