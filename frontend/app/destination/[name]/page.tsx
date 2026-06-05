'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getItinerary, saveTrip } from '@/lib/api';
import { initAuth } from '@/store/authStore';

export default function DestinationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [destData, setDestData] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    initAuth();
    const token = localStorage.getItem('tripwise_token');
    if (!token) { router.push('/login'); return; }

    // Parse destination data from query params
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No destination data found. Go back and select a destination.');
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(dataParam));
      setDestData(parsed);

      // If itinerary already exists (top-1 result), use it
      if (parsed.aiItinerary) {
        setItinerary(parsed.aiItinerary);
        setLoading(false);
      } else {
        // Fetch on-demand
        fetchItinerary(parsed);
      }
    } catch (e) {
      setError('Failed to parse destination data.');
      setLoading(false);
    }
  }, []);

  const fetchItinerary = async (data: any) => {
    try {
      const res = await getItinerary({
        destinationName: data.destination.name,
        days: data.userConstraints?.days || 3,
        budget: data.userConstraints?.budget || 5000,
        preferences: data.userConstraints?.preferences || [],
        travelMode: data.userConstraints?.travelMode || 'any'
      });
      setItinerary(res.data.itinerary);
    } catch (err: any) {
      setError('Failed to generate itinerary. AI service may be busy — try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!destData || !itinerary) return;
    setSaving(true);
    try {
      const dest = destData.destination;
      await saveTrip({
        destinationName: dest.name,
        destinationState: dest.state,
        destinationCoordinates: dest.location?.coordinates,
        days: destData.userConstraints?.days || 3,
        budget: destData.userConstraints?.budget || 5000,
        travelMode: destData.userConstraints?.travelMode || 'any',
        preferences: destData.userConstraints?.preferences || [],
        finalScore: destData.finalScore,
        distanceKm: destData.distanceKm,
        estimatedTotalCost: destData.estimatedTotalCost,
        scores: destData.scores,
        transportData: destData.transportData,
        weatherData: destData.weatherData,
        itinerary,
        attractions: dest.attractions || []
      });
      setSaved(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setSaved(true); // Already saved
      } else {
        alert('Failed to save trip');
      }
    } finally {
      setSaving(false);
    }
  };

  if (error && !destData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#fca5a5', fontSize: '16px' }}>{error}</p>
        <button onClick={() => router.push('/explore')} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer' }}>← Back to Explore</button>
      </div>
    );
  }

  if (!destData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading destination...</p>
      </div>
    );
  }

  const dest = destData.destination;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => router.push('/explore')} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>←</button>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>✈️ TripWise AI</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/trips')} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>My Trips</button>
          {itinerary && !saved && (
            <button onClick={handleSave} disabled={saving}
              style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {saving ? 'Saving...' : '💾 Save Trip'}
            </button>
          )}
          {saved && (
            <span style={{ background: '#052e16', color: '#34d399', borderRadius: '6px', padding: '6px 16px', fontSize: '13px', fontWeight: '600' }}>✅ Saved</span>
          )}
          <span className="score-badge" style={{ fontSize: '14px', padding: '6px 16px' }}>{destData.finalScore}</span>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ padding: '24px 16px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>{dest.name}</h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
          {dest.state} · {destData.distanceKm}km away · Estimated ₹{destData.estimatedTotalCost?.toLocaleString()}
        </p>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {destData.weatherData && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
              <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>WEATHER</p>
              <p style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700' }}>🌡️ {destData.weatherData.temp}°C</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'capitalize' }}>{destData.weatherData.weatherDescription}</p>
            </div>
          )}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>DISTANCE</p>
            <p style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700' }}>📍 {destData.distanceKm}km</p>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>EST. COST</p>
            <p style={{ color: '#10b981', fontSize: '18px', fontWeight: '700' }}>₹{destData.estimatedTotalCost?.toLocaleString()}</p>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '140px' }}>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>SCORE</p>
            <p style={{ color: '#3b82f6', fontSize: '18px', fontWeight: '700' }}>{destData.finalScore}/100</p>
          </div>
        </div>

        {/* Transport Options */}
        {destData.transportData?.fares && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>TRANSPORT OPTIONS</h3>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
              {destData.transportData.isEstimated ? 'Estimated road distance' : 'Real road distance'}: {destData.transportData.roadDistanceKm}km
              {destData.transportData.drivingTimeMinutes && ` · ~${Math.round(destData.transportData.drivingTimeMinutes / 60)}h ${destData.transportData.drivingTimeMinutes % 60}m drive`}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(destData.transportData.fares).map(([mode, data]: any) => {
                const icons: Record<string, string> = { train: '🚂', bus: '🚌', flight: '✈️', cab: '🚕' };
                const icon = icons[mode] || '🚗';
                return (
                  <div key={mode} style={{
                    background: data.available ? '#0f172a' : '#0f172a80',
                    border: '1px solid',
                    borderColor: data.available ? '#334155' : '#1e293b',
                    borderRadius: '10px',
                    padding: '14px',
                    opacity: data.available ? 1 : 0.5
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: '700', textTransform: 'capitalize' }}>{icon} {mode}</span>
                      {data.available && <span style={{ background: '#052e16', color: '#34d399', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>Available</span>}
                      {!data.available && <span style={{ background: '#450a0a', color: '#fca5a5', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>N/A</span>}
                    </div>
                    {data.available ? (
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        <p style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#10b981', fontWeight: '700' }}>₹{data.minFare?.toLocaleString()} – ₹{data.maxFare?.toLocaleString()}</span>
                        </p>
                        <p>⏱️ ~{data.estimatedTime >= 60 ? `${Math.floor(data.estimatedTime / 60)}h ${data.estimatedTime % 60}m` : `${data.estimatedTime}m`}</p>
                        {data.label && <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{data.label}</p>}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#64748b' }}>{data.reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        {destData.scores && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>SCORE BREAKDOWN</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {Object.entries(destData.scores).map(([key, value]: any) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'capitalize' }}>{key}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: value > 70 ? '#10b981' : value > 40 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                    </div>
                    <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600', width: '30px', textAlign: 'right' }}>{Math.round(value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attractions */}
        {dest.attractions && dest.attractions.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>TOP ATTRACTIONS</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {dest.attractions.map((attr: string, i: number) => (
                <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', color: '#94a3b8' }}>
                  📍 {attr}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Itinerary */}
        <div style={{ marginBottom: '24px' }}>
          {loading ? (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤖</div>
              <p style={{ color: '#3b82f6', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Generating your personalized itinerary...</p>
              <p style={{ color: '#64748b', fontSize: '13px' }}>AI is crafting a day-by-day plan based on your budget, preferences, and current weather.</p>
              <div style={{ marginTop: '16px', width: '200px', height: '4px', background: '#334155', borderRadius: '2px', margin: '16px auto 0', overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', background: '#3b82f6', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ) : error && !itinerary ? (
            <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
              <button onClick={() => { setLoading(true); setError(''); fetchItinerary(destData); }}
                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' }}>
                🔄 Retry
              </button>
            </div>
          ) : itinerary ? (
            <div>
              {/* Tagline */}
              {itinerary.tagline && (
                <p style={{ color: '#94a3b8', fontSize: '16px', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.6' }}>
                  "{itinerary.tagline}"
                </p>
              )}

              {/* Why Recommended */}
              {itinerary.whyRecommended && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <h3 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>WHY THIS DESTINATION?</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.7' }}>{itinerary.whyRecommended}</p>
                </div>
              )}

              {/* Day-by-Day Itinerary */}
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

              {/* Budget Breakdown */}
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

              {/* Packing List */}
              {itinerary.packingList && itinerary.packingList.length > 0 && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <h3 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>🎒 PACKING LIST</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {itinerary.packingList.map((item: string, i: number) => (
                      <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', color: '#94a3b8' }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Tips */}
              {itinerary.localTips && itinerary.localTips.length > 0 && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <h3 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>LOCAL TIPS</h3>
                  {itinerary.localTips.map((tip: string, i: number) => (
                    <p key={i} style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', lineHeight: '1.6' }}>• {tip}</p>
                  ))}
                </div>
              )}

              {/* Weather Advice */}
              {itinerary.weatherAdvice && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>🌤️ WEATHER ADVICE</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>{itinerary.weatherAdvice}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
