import {useState, useEffect} from 'react';

export default function TicketDetailPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  return (
    <div className="user-admin-page">
      <h1>Administración de Usuarios</h1>
    </div>
  );
}