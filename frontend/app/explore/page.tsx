'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getRecommendations } from '@/lib/api';
import { useAuthStore, initAuth } from '@/store/authStore';

const Map = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => (
  <div style={{ width: '100%', height: '100%', background: '#1e293b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
    Loading map...
  </div>
) });

const PREFERENCES = ['hills', 'nature', 'beach', 'heritage', 'adventure', 'spiritual', 'wildlife', 'offbeat'];
const TRAVEL_MODES = ['any', 'train', 'bus', 'flight', 'cab'];

export default function ExplorePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [form, setForm] = useState({ cityName: '', days: 3, budget: 5000, travelMode: 'any', preferences: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLocationName, setMapLocationName] = useState('');
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(true); // mobile bottom sheet state

  useEffect(() => {
    initAuth();
    const token = localStorage.getItem('tripwise_token');
    if (!token) router.push('/login');
  }, [router]);

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setForm(f => ({ ...f, cityName: '' }));
          setMapLocationName(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        },
        () => alert('Location access denied. Enter city name manually.')
      );
    }
  };

  const togglePreference = (pref: string) => {
    setForm(f => ({
      ...f,
      preferences: f.preferences.includes(pref)
        ? f.preferences.filter(p => p !== pref)
        : [...f.preferences, pref]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityName && !userLocation) { setError('Enter a city or allow location access'); return; }
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const payload: any = { days: form.days, budget: form.budget, travelMode: form.travelMode, preferences: form.preferences };
      if (form.cityName) { payload.cityName = form.cityName; }
      else if (userLocation) { payload.userLat = userLocation.lat; payload.userLng = userLocation.lng; }

      const res = await getRecommendations(payload);
      setResults(res.data.recommendations || []);
      if (res.data.userLocation) setUserLocation({ lat: res.data.userLocation.lat, lng: res.data.userLocation.lng });
      setSheetOpen(true); // auto-open sheet on mobile to show results
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const navigateToDestination = (result: any) => {
    const data = { ...result, userConstraints: { days: form.days, budget: form.budget, preferences: form.preferences, travelMode: form.travelMode } };
    const encoded = encodeURIComponent(JSON.stringify(data));
    router.push(`/destination/${encodeURIComponent(result.destination.name)}?data=${encoded}`);
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  // Shared form JSX (used in both desktop sidebar and mobile sheet)
  const formContent = (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Your Location</label>
          <input className="input-field" placeholder={userLocation ? `📍 ${mapLocationName || 'Map pin selected'}` : 'e.g. Mumbai, Delhi, Bangalore'}
            value={form.cityName} onChange={e => { setForm({ ...form, cityName: e.target.value }); if (e.target.value) { setUserLocation(null); setMapLocationName(''); } setResults([]); }}
            style={{ fontSize: '14px' }} />
          {userLocation && !form.cityName && (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#10b981', fontSize: '12px' }}>📍 {mapLocationName || 'Pin on map'}</span>
              <button type="button" onClick={() => { setUserLocation(null); setMapLocationName(''); setResults([]); }}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>✕ Clear</button>
            </div>
          )}
          <button type="button" onClick={handleGeolocate}
            style={{ marginTop: '8px', background: '#0f172a', border: '1px solid #334155', color: '#64748b', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
            📍 Use My Location
          </button>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Vacation Days: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{form.days}</span></label>
          <input type="range" min="1" max="14" value={form.days}
            onChange={e => setForm({ ...form, days: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
            <span>1 day</span><span>14 days</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Budget: <span style={{ color: '#10b981', fontWeight: '700' }}>₹{form.budget.toLocaleString()}</span></label>
          <input type="range" min="1000" max="100000" step="500" value={form.budget}
            onChange={e => setForm({ ...form, budget: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: '#10b981' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
            <span>₹1K</span><span>₹1L</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>Travel Mode</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TRAVEL_MODES.map(mode => (
              <button key={mode} type="button" onClick={() => setForm({ ...form, travelMode: mode })}
                style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid', borderColor: form.travelMode === mode ? '#3b82f6' : '#334155', background: form.travelMode === mode ? '#1e3a5f' : 'transparent', color: form.travelMode === mode ? '#93c5fd' : '#64748b', textTransform: 'capitalize' }}>
                {mode === 'any' ? '🌐 Any' : mode === 'train' ? '🚂 Train' : mode === 'bus' ? '🚌 Bus' : mode === 'flight' ? '✈️ Flight' : '🚕 Cab'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>Preferences (optional)</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PREFERENCES.map(pref => (
              <button key={pref} type="button" onClick={() => togglePreference(pref)}
                style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid', borderColor: form.preferences.includes(pref) ? '#10b981' : '#334155', background: form.preferences.includes(pref) ? '#052e16' : 'transparent', color: form.preferences.includes(pref) ? '#34d399' : '#64748b', textTransform: 'capitalize' }}>
                {pref}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '13px' }}>{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ fontSize: '15px', padding: '14px' }}>
          {loading ? '🔍 Finding best trips...' : '🗺️ Find My Trips'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px' }}>
            TOP {results.length} DESTINATIONS
          </h3>
          {results.map((result: any, i: number) => (
            <div key={i} onClick={() => navigateToDestination(result)}
              style={{ padding: '12px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', border: '1px solid', borderColor: '#334155', background: '#0f172a', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>{i + 1}. {result.destination.name}</span>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{result.destination.state} · {result.distanceKm}km</div>
                </div>
                <span className="score-badge" style={{ fontSize: '11px' }}>{result.finalScore}</span>
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569' }}>
                <span>₹{result.estimatedTotalCost?.toLocaleString()}</span>
                {result.weatherData && <span>🌡️ {result.weatherData.temp}°C</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const mapElement = (
    <Map userLocation={userLocation} destinations={results.map(r => r.destination ? { ...r.destination, finalScore: r.finalScore, distanceKm: r.distanceKm, estimatedTotalCost: r.estimatedTotalCost, weatherData: r.weatherData } : r)} onDestinationClick={(dest) => { const found = results.find(r => r.destination?.name === dest.name); if (found) navigateToDestination(found); }} onMapClick={(lat, lng, cityName) => { setUserLocation({ lat, lng }); setMapLocationName(cityName || `${lat.toFixed(2)}, ${lng.toFixed(2)}`); setForm(f => ({ ...f, cityName: '' })); setResults([]); }} />
  );

  return (
    <div className="explore-page">
      {/* Header */}
      <header className="explore-header">
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}>✈️ TripWise AI</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="header-greeting">Hi, {user?.name || 'Traveller'} 👋</span>
          <button onClick={() => router.push('/trips')} className="header-btn header-btn-primary">My Trips</button>
          <button onClick={handleLogout} className="header-btn">Logout</button>
        </div>
      </header>

      {/* DESKTOP LAYOUT */}
      <div className="desktop-layout">
        <div className="desktop-sidebar">
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#f1f5f9' }}>Plan Your Trip</h2>
          {formContent}
        </div>
        <div className="desktop-map">
          <div style={{ position: 'absolute', inset: '16px' }}>
            {mapElement}
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="mobile-layout">
        <div className="mobile-map">
          {mapElement}
        </div>

        {/* Bottom Sheet Toggle */}
        <button className="sheet-toggle" onClick={() => setSheetOpen(!sheetOpen)}>
          <div style={{ width: '40px', height: '4px', background: '#475569', borderRadius: '2px', margin: '0 auto 8px' }} />
          {sheetOpen ? '↓ Hide' : `↑ Plan Trip ${results.length > 0 ? `(${results.length} results)` : ''}`}
        </button>

        {/* Bottom Sheet */}
        <div className={`mobile-sheet ${sheetOpen ? 'sheet-open' : 'sheet-closed'}`}>
          <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#f1f5f9' }}>Plan Your Trip</h2>
            {formContent}
          </div>
        </div>
      </div>

      <style jsx>{`
        .explore-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .explore-header {
          background: #1e293b;
          border-bottom: 1px solid #334155;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }
        .header-greeting {
          color: #94a3b8;
          font-size: 14px;
        }
        .header-btn {
          background: transparent;
          border: 1px solid #475569;
          color: #94a3b8;
          border-radius: 6px;
          padding: 6px 14px;
          cursor: pointer;
          font-size: 13px;
        }
        .header-btn-primary {
          border-color: #3b82f6;
          color: #93c5fd;
        }

        /* DESKTOP: sidebar + map */
        .desktop-layout {
          display: flex;
          height: calc(100vh - 52px);
          overflow: hidden;
        }
        .desktop-sidebar {
          width: 340px;
          min-width: 340px;
          background: #1e293b;
          border-right: 1px solid #334155;
          padding: 20px;
          overflow-y: auto;
          height: 100%;
        }
        .desktop-map {
          flex: 1;
          position: relative;
          height: 100%;
        }

        /* MOBILE: hidden on desktop */
        .mobile-layout {
          display: none;
        }

        /* MOBILE BREAKPOINT */
        @media (max-width: 768px) {
          .desktop-layout {
            display: none;
          }
          .mobile-layout {
            display: flex;
            flex-direction: column;
            flex: 1;
            position: relative;
          }
          .header-greeting {
            display: none;
          }
          .explore-header {
            padding: 10px 16px;
          }
          .mobile-map {
            flex: 1;
            min-height: 300px;
          }
          .sheet-toggle {
            background: #1e293b;
            border: none;
            border-top: 1px solid #334155;
            color: #94a3b8;
            padding: 8px;
            font-size: 13px;
            cursor: pointer;
            text-align: center;
            z-index: 50;
          }
          .mobile-sheet {
            background: #1e293b;
            border-top: 1px solid #334155;
            transition: max-height 0.3s ease, opacity 0.3s ease;
            overflow: hidden;
          }
          .sheet-open {
            max-height: 85vh;
            opacity: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .sheet-closed {
            max-height: 0;
            opacity: 0;
          }
        }

        /* hide sheet toggle on desktop */
        .sheet-toggle {
          display: none;
        }
        @media (max-width: 768px) {
          .sheet-toggle {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
