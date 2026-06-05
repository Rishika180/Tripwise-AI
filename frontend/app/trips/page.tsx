'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyTrips, deleteTrip } from '@/lib/api';
import { useAuthStore, initAuth } from '@/store/authStore';

export default function TripsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initAuth();
    const token = localStorage.getItem('tripwise_token');
    if (!token) { router.push('/login'); return; }
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await getMyTrips();
      setTrips(res.data.trips || []);
    } catch (err: any) {
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved trip?')) return;
    try {
      await deleteTrip(id);
      setTrips(trips.filter(t => t._id !== id));
    } catch {
      alert('Failed to delete trip');
    }
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6', cursor: 'pointer' }} onClick={() => router.push('/explore')}>✈️ TripWise AI</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => router.push('/explore')} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>← Explore</button>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>My Saved Trips</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>{trips.length} trip{trips.length !== 1 ? 's' : ''} saved</p>

        {loading && <p style={{ color: '#64748b' }}>Loading trips...</p>}
        {error && <p style={{ color: '#fca5a5' }}>{error}</p>}

        {!loading && trips.length === 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '16px' }}>No saved trips yet</p>
            <button onClick={() => router.push('/explore')} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px' }}>
              Start Exploring
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {trips.map((trip) => (
            <div key={trip._id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => router.push(`/trip/${trip._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>{trip.destinationName}</h3>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>{trip.destinationState} · {trip.distanceKm}km · {trip.days} days · ₹{trip.budget?.toLocaleString()} budget</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="score-badge">{trip.finalScore}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(trip._id); }}
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>
                    🗑️
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                <span>₹{trip.estimatedTotalCost?.toLocaleString()} est.</span>
                <span>🚗 {trip.travelMode}</span>
                <span>📅 {new Date(trip.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
