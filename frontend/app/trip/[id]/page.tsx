'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTripById } from '@/lib/api';
import { initAuth } from '@/store/authStore';

export default function SavedTripPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initAuth();
    const token = localStorage.getItem('tripwise_token');
    if (!token) { router.push('/login'); return; }

    const fetchTrip = async () => {
      try {
        const res = await getTripById(params.id as string);
        setTrip(res.data.trip);
      } catch (err: any) {
        setError('Trip not found or access denied');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [params.id]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748b' }}>Loading trip...</p></div>;
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: '#fca5a5' }}>{error}</p>
      <button onClick={() => router.push('/trips')} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer' }}>← Back to Trips</button>
    </div>
  );
  if (!trip) return null;

  const itinerary = trip.itinerary;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/trips')} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>← My Trips</button>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}>✈️ TripWise AI</h1>
        </div>
        <span className="score-badge" style={{ fontSize: '14px', padding: '6px 16px' }}>{trip.finalScore}</span>
      </header>

      <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>Saved on {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>{trip.destinationName}</h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
          {trip.destinationState} · {trip.distanceKm}km · {trip.days} days · ₹{trip.budget?.toLocaleString()} budget
        </p>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {trip.weatherData && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
              <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>WEATHER (at save)</p>
              <p style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700' }}>🌡️ {trip.weatherData.temp}°C</p>
            </div>
          )}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>EST. COST</p>
            <p style={{ color: '#10b981', fontSize: '18px', fontWeight: '700' }}>₹{trip.estimatedTotalCost?.toLocaleString()}</p>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>TRAVEL MODE</p>
            <p style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700', textTransform: 'capitalize' }}>{trip.travelMode}</p>
          </div>
        </div>

        {/* Transport Options */}
        {trip.transportData?.fares && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>TRANSPORT OPTIONS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(trip.transportData.fares).map(([mode, data]: any) => {
                const icons: Record<string, string> = { train: '🚂', bus: '🚌', flight: '✈️', cab: '🚕' };
                return data.available ? (
                  <div key={mode} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
                    <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: '700', textTransform: 'capitalize' }}>{icons[mode]} {mode}</span>
                    <p style={{ color: '#10b981', fontWeight: '700', fontSize: '13px', marginTop: '6px' }}>₹{data.minFare?.toLocaleString()} – ₹{data.maxFare?.toLocaleString()}</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>~{data.estimatedTime >= 60 ? `${Math.floor(data.estimatedTime / 60)}h ${data.estimatedTime % 60}m` : `${data.estimatedTime}m`}</p>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Attractions */}
        {trip.attractions?.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>TOP ATTRACTIONS</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {trip.attractions.map((a: string, i: number) => (
                <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', color: '#94a3b8' }}>📍 {a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Itinerary */}
        {itinerary && (
          <div>
            {itinerary.tagline && <p style={{ color: '#94a3b8', fontSize: '16px', fontStyle: 'italic', marginBottom: '20px' }}>"{itinerary.tagline}"</p>}

            {itinerary.whyRecommended && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>WHY THIS DESTINATION?</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.7' }}>{itinerary.whyRecommended}</p>
              </div>
            )}

            <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>DAY-BY-DAY ITINERARY</h3>
            {itinerary.itinerary?.map((day: any) => (
              <div key={day.day} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '12px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ color: '#3b82f6', fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Day {day.day}: {day.title}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                  <p>🌅 <strong style={{ color: '#f1f5f9' }}>Morning:</strong> {day.morning}</p>
                  <p>☀️ <strong style={{ color: '#f1f5f9' }}>Afternoon:</strong> {day.afternoon}</p>
                  <p>🌙 <strong style={{ color: '#f1f5f9' }}>Evening:</strong> {day.evening}</p>
                  <p>🍽️ <strong style={{ color: '#f1f5f9' }}>Meals:</strong> {day.meals}</p>
                  {day.tips && <p>💡 <strong style={{ color: '#f59e0b' }}>Tip:</strong> {day.tips}</p>}
                </div>
              </div>
            ))}

            {itinerary.budgetBreakdown && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: '#10b981', fontSize: '14px', fontWeight: '700', marginBottom: '14px' }}>BUDGET BREAKDOWN</h3>
                {Object.entries(itinerary.budgetBreakdown).map(([k, v]: any) => k !== 'total' && (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', fontSize: '14px' }}>
                    <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{k}</span>
                    <span style={{ color: '#f1f5f9' }}>₹{v?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '16px', fontWeight: '700' }}>
                  <span style={{ color: '#10b981' }}>Total</span>
                  <span style={{ color: '#10b981' }}>₹{itinerary.budgetBreakdown.total?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {itinerary.localTips?.length > 0 && (
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>LOCAL TIPS</h3>
                {itinerary.localTips.map((tip: string, i: number) => (
                  <p key={i} style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>• {tip}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
