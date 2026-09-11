import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LifeBuoy } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import '../../css/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Llamada al servicio de autenticación
      const data = await authService.login(email, password);
      
      // Guardar el token (asumiendo que el back retorna access_token o token)
      const token = data.access_token || data.token;
      login(token, data.user);

      // Redirigir al Dashboard operativo
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Credenciales inválidas o error al conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Panel Izquierdo - Branding */}
      <div className="auth-brand-panel">
        <div className="brand-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <LifeBuoy size={36} color="#38bdf8" />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
              HelpDesk Core
            </span>
          </div>
        </div>
        
        <div className="brand-content">
          <h1>Gestión inteligente de <span>Soporte Técnico</span></h1>
          <p>
            Plataforma interna optimizada para la trazabilidad total de solicitudes, 
            asignación dinámica de agentes y reportes analíticos de alto rendimiento.
          </p>
        </div>

        <div className="brand-footer">
          <p>© 2026 — Created by Diego Puerta Correa</p>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Acceso */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <div className="input-with-icon">
                <Mail />
                <input 
                  type="email" 
                  placeholder="ejemplo@empresa.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <Lock />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Validando acceso...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}