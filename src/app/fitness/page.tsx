"use client";

import { useEffect, useState, useMemo } from "react";

interface Activity {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  total_elevation_gain: number; // in meters
  type: string;
  start_date: string;
  start_latlng?: [number, number];
  map?: {
    summary_polyline: string;
  };
}

function decodePolyline(str: string, precision = 5) {
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change; lng += longitude_change;
    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

const ActivityMap = ({ polyline }: { polyline?: string }) => {
  if (!polyline) {
    return <div style={{ width: "100%", height: "100px", background: "var(--surface-color)", borderRadius: "12px", border: "1px dashed var(--surface-border)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>No route data</span></div>;
  }
  
  const points = decodePolyline(polyline);
  if (points.length === 0) return null;
  
  const lats = points.map(p => p[0]);
  const lngs = points.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const latRange = maxLat - minLat || 0.0001;
  let lngRange = maxLng - minLng || 0.0001;
  
  // Approximate Mercator projection to fix aspect ratio based on latitude
  const midLat = (maxLat + minLat) / 2;
  const lngMultiplier = Math.cos(midLat * Math.PI / 180);
  lngRange = lngRange * lngMultiplier;

  const maxRange = Math.max(latRange, lngRange);
  
  const width = 100;
  const height = 100;
  const padding = 10;
  
  const xOffset = (1 - ((maxLng - minLng) * lngMultiplier) / maxRange) / 2;
  const yOffset = (1 - (maxLat - minLat) / maxRange) / 2;
  
  const projectedPoints = points.map(p => {
    let x = xOffset + ((p[1] - minLng) * lngMultiplier) / maxRange;
    let yNormalized = yOffset + (p[0] - minLat) / maxRange;
    x = padding + x * (width - 2 * padding);
    let y = height - padding - yNormalized * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: "100%", height: "120px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <polyline 
          points={projectedPoints} 
          fill="none" 
          stroke="#FC4C02" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ filter: "drop-shadow(0px 0px 4px rgba(252, 76, 2, 0.5))" }}
        />
      </svg>
    </div>
  );
};

const ActivityLocation = ({ latlng }: { latlng?: [number, number] }) => {
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (!latlng || latlng.length !== 2) return;
    const [lat, lng] = latlng;
    
    const cacheKey = `loc_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setLocationName(cached);
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`)
      .then(r => r.json())
      .then(data => {
        const address = data.address;
        if (!address) return;
        const name = address.suburb || address.neighbourhood || address.city_district || address.town || address.city || address.county || data.name;
        if (name) {
          setLocationName(name);
          sessionStorage.setItem(cacheKey, name);
        }
      })
      .catch(() => {});
  }, [latlng]);

  if (!locationName) return null;
  return (
    <span style={{ fontSize: "0.75rem", color: "inherit", display: "flex", alignItems: "center", gap: "4px" }}>
      📍 {locationName}
    </span>
  );
};

export default function FitnessPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'individual' | 'day' | 'week' | 'month' | 'year'>('individual');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<Record<string, {name: string, value: string}[]>>({});

  useEffect(() => {
    const saved = localStorage.getItem('personal_records');
    if (saved) {
      try {
        setPersonalRecords(JSON.parse(saved));
      } catch (e) {}
    } else {
      setPersonalRecords({
        "Running": [
          { name: "100mtr", value: "" },
          { name: "200mtr", value: "" },
          { name: "400mtr", value: "" },
          { name: "800mtr", value: "" },
          { name: "1km", value: "" },
          { name: "1600mtr", value: "" },
          { name: "5km", value: "" },
          { name: "10km", value: "" },
          { name: "20km", value: "" },
          { name: "Half Marathon", value: "" },
          { name: "30km", value: "" },
          { name: "Marathon", value: "" }
        ],
        "Strength": [
          { name: "Bench Press", value: "" },
          { name: "Squats", value: "" },
          { name: "Deadlifts", value: "" },
          { name: "Pushups", value: "" },
          { name: "Pullups", value: "" }
        ]
      });
    }
  }, []);

  const savePRs = (newPRs: Record<string, {name: string, value: string}[]>) => {
    setPersonalRecords(newPRs);
    localStorage.setItem('personal_records', JSON.stringify(newPRs));
  };

  const fetchActivities = async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem('strava_activities');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setActivities(parsed);
          setIsConnected(true);
          setLoading(false);
          return;
        } catch (e) {}
      }
    }
    
    setLoading(true);
    fetch("/api/strava/activities")
      .then(res => {
        if (res.status === 401) {
          setIsConnected(false);
          setLoading(false);
          throw new Error("Not connected");
        }
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setIsConnected(true);
        setActivities(data.activities);
        localStorage.setItem('strava_activities', JSON.stringify(data.activities));
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (typeFilter !== 'all' && a.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (startDate && new Date(a.start_date) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(a.start_date) > end) return false;
      }
      return true;
    });
  }, [activities, startDate, endDate, typeFilter]);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    d.setDate(diff);
    return d;
  };

  const groupedActivities = useMemo(() => {
    if (groupBy === 'individual') return filteredActivities.map(a => ({ ...a, activities: [a] }));

    const groups = new Map<string, any>();

    filteredActivities.forEach(a => {
      const d = new Date(a.start_date);
      let key = '';
      let groupName = '';

      switch (groupBy) {
        case 'day':
          key = d.toISOString().split('T')[0];
          groupName = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          break;
        case 'week': {
          const weekStart = getWeekStart(d);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          key = weekStart.toISOString().split('T')[0];
          groupName = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
          break;
        }
        case 'month':
          key = `${d.getFullYear()}-${d.getMonth()}`;
          groupName = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
          break;
        case 'year':
          key = `${d.getFullYear()}`;
          groupName = `${d.getFullYear()}`;
          break;
      }

      const existing = groups.get(key);
      if (existing) {
        existing.distance += a.distance;
        existing.moving_time += a.moving_time;
        existing.count += 1;
        existing.type = existing.count > 1 ? 'Multiple' : a.type;
        existing.activities.push(a);
      } else {
        groups.set(key, {
          id: key,
          name: groupName,
          type: a.type,
          start_date: a.start_date,
          distance: a.distance,
          moving_time: a.moving_time,
          count: 1,
          activities: [a]
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [filteredActivities, groupBy]);


  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + " km";
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatPace = (distanceMeters: number, timeSeconds: number) => {
    if (!distanceMeters || !timeSeconds) return "-";
    const km = distanceMeters / 1000;
    const paceSecondsPerKm = timeSeconds / km;
    const m = Math.floor(paceSecondsPerKm / 60);
    const s = Math.floor(paceSecondsPerKm % 60);
    return `${m}:${s.toString().padStart(2, '0')} /km`;
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run': return '🏃‍♂️';
      case 'ride': return '🚴‍♂️';
      case 'swim': return '🏊‍♂️';
      case 'walk': return '🚶‍♂️';
      case 'weighttraining': return '🏋️‍♂️';
      case 'workout': return '💪';
      case 'yoga': return '🧘‍♂️';
      default: return '👟';
    }
  };

  return (
    <main className="app-container">
      {!isConnected && !loading && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <a 
            href="/api/strava/auth" 
            style={{
              background: "#FC4C02",
              color: "white",
              padding: "0.8rem 1.5rem",
              borderRadius: "12px",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 14px rgba(252, 76, 2, 0.4)"
            }}
          >
            Connect with Strava
          </a>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Top Controls Bar */}
        <div className="filters-container glass-panel" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", padding: "1rem", borderRadius: "12px", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", background: isFiltersOpen ? "rgba(255,255,255,0.1)" : "transparent", border: "1px solid var(--surface-border)", color: "var(--text-primary)", cursor: "pointer", height: "37px", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>⚙️ Filters</span>
              {(startDate || endDate || typeFilter !== 'all' || groupBy !== 'individual') && (
                <span style={{ background: "var(--accent-color)", color: "white", borderRadius: "50%", width: "8px", height: "8px", display: "inline-block" }}></span>
              )}
            </button>

            <button 
              onClick={() => fetchActivities(true)}
              disabled={loading || !isConnected}
              style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", background: "transparent", border: "1px solid var(--surface-border)", color: "var(--text-primary)", cursor: loading || !isConnected ? "not-allowed" : "pointer", opacity: isConnected ? 1 : 0.5, display: "flex", alignItems: "center", gap: "0.5rem", height: "37px" }}
              title="Refresh Strava Data"
            >
              Refresh 🔄
            </button>
            <button 
              onClick={() => setIsPRModalOpen(true)}
              style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", background: "var(--surface-color)", border: "1px solid var(--accent-color)", color: "var(--accent-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", height: "37px", fontWeight: "600" }}
            >
              My PRs 🏆
            </button>
          </div>

          <button 
            style={{ padding: "0.5rem 1.2rem", borderRadius: "8px", background: "var(--accent-color)", border: "none", color: "white", cursor: "pointer", fontWeight: "600", height: "37px", boxShadow: "0 2px 10px rgba(252, 76, 2, 0.3)" }}
            onClick={() => alert('Add workout modal coming soon!')}
          >
            + Add a workout
          </button>

          {/* Filters Dropdown/Popover */}
          {isFiltersOpen && (
            <div style={{ position: "absolute", top: "100%", left: "0", marginTop: "0.5rem", padding: "1.5rem", borderRadius: "12px", zIndex: 50, display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "350px", background: "#1a1a24", border: "1px solid var(--surface-border)", boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: "600" }}>Filters</h3>
                <button onClick={() => setIsFiltersOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500", textTransform: "uppercase" }}>Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid var(--surface-border)", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", colorScheme: "dark", width: "100%" }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500", textTransform: "uppercase" }}>End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid var(--surface-border)", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", colorScheme: "dark", width: "100%" }}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500", textTransform: "uppercase" }}>Type</label>
                <select 
                  value={typeFilter} 
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid var(--surface-border)", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", width: "100%" }}
                >
                  <option value="all" style={{ color: "black" }}>All Types</option>
                  <option value="run" style={{ color: "black" }}>Run</option>
                  <option value="walk" style={{ color: "black" }}>Walk</option>
                  <option value="ride" style={{ color: "black" }}>Cycling</option>
                  <option value="swim" style={{ color: "black" }}>Swim</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500", textTransform: "uppercase" }}>Group By</label>
                <select 
                  value={groupBy} 
                  onChange={e => setGroupBy(e.target.value as any)}
                  style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid var(--surface-border)", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", width: "100%" }}
                >
                  <option value="individual" style={{ color: "black" }}>Individual</option>
                  <option value="day" style={{ color: "black" }}>Day</option>
                  <option value="week" style={{ color: "black" }}>Week</option>
                  <option value="month" style={{ color: "black" }}>Month</option>
                  <option value="year" style={{ color: "black" }}>Year</option>
                </select>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "0.5rem" }}>
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setTypeFilter('all'); setGroupBy('individual'); }}
                  style={{ padding: "0.5rem 1rem", borderRadius: "8px", background: "transparent", border: "1px solid var(--surface-border)", color: "var(--text-secondary)", cursor: "pointer", flex: 1 }}
                >
                  Clear filters
                </button>
                <button 
                  onClick={() => setIsFiltersOpen(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "8px", background: "var(--accent-color)", border: "none", color: "white", cursor: "pointer", flex: 1, fontWeight: "600" }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ width: "100%" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>Loading activities...</p>
            </div>
          ) : !isConnected ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <span style={{ fontSize: "4rem", display: "block", marginBottom: "1rem" }}>🏃‍♂️</span>
              <h2 style={{ marginBottom: "1rem" }}>Connect Your Accounts</h2>
              <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>Link your Strava account to automatically sync and display your recent workouts directly on your dashboard.</p>
            </div>
          ) : groupedActivities.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <h2 style={{ marginBottom: "1rem" }}>No activities found</h2>
              <p style={{ color: "var(--text-secondary)" }}>Adjust your filters or go for a run!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {groupedActivities.map((activity: any) => (
                <div 
                  key={activity.id} 
                  className="glass-panel day-card" 
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", cursor: "pointer", transition: "transform 0.2s" }}
                  onClick={() => setSelectedItem(activity)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                      <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{getActivityIcon(activity.type)}</span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.1rem", color: "var(--text-primary)", lineHeight: "1.2" }} title={activity.name}>
                          {activity.name}
                        </h3>
                        <p style={{ color: "var(--accent-color)", fontWeight: "500", fontSize: "0.75rem" }}>
                          {activity.type} {activity.count > 1 ? `(${activity.count})` : ''}
                        </p>
                      </div>
                    </div>
                    {groupBy === 'individual' && (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: "500", paddingTop: "0.25rem", whiteSpace: "nowrap" }}>
                        {new Date(activity.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  
                  {groupBy === 'individual' && activity.map?.summary_polyline ? (
                    <div style={{ position: "relative", width: "100%", marginTop: "0.25rem", marginBottom: "0.25rem" }}>
                      <ActivityMap polyline={activity.map.summary_polyline} />
                      <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: "8px", backdropFilter: "blur(4px)", color: "white" }}>
                        <ActivityLocation latlng={activity.start_latlng} />
                      </div>
                    </div>
                  ) : groupBy === 'individual' && activity.start_latlng ? (
                    <div style={{ width: "100%", marginTop: "0.25rem", marginBottom: "0.25rem", display: "flex", justifyContent: "flex-end", color: "var(--text-secondary)" }}>
                      <ActivityLocation latlng={activity.start_latlng} />
                    </div>
                  ) : null}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", width: "100%", marginTop: "0.25rem" }}>
                    <div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px" }}>Distance</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" }}>{formatDistance(activity.distance)}</p>
                    </div>
                    <div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px" }}>Time</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" }}>{formatTime(activity.moving_time)}</p>
                    </div>
                    <div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px" }}>Pace</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" }}>{formatPace(activity.distance, activity.moving_time)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1rem" }} onClick={() => setSelectedItem(null)}>
          <div style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#1a1a24", borderRadius: "16px", border: "1px solid #2a2a35", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.1)", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onClick={() => setSelectedItem(null)}>×</button>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <span style={{ fontSize: "3rem", background: "#252530", padding: "0.75rem", borderRadius: "16px", border: "1px solid #333340" }}>{getActivityIcon(selectedItem.type)}</span>
              <div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.25rem" }}>{selectedItem.name}</h2>
                <p style={{ color: "var(--accent-color)", fontWeight: "500" }}>
                  {groupBy === 'individual' ? new Date(selectedItem.start_date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : selectedItem.name}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", background: "#252530", padding: "1.5rem", borderRadius: "16px", border: "1px solid #333340" }}>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Distance</p>
                <p style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)" }}>{formatDistance(selectedItem.distance)}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Time</p>
                <p style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)" }}>{formatTime(selectedItem.moving_time)}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Pace</p>
                <p style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)" }}>{formatPace(selectedItem.distance, selectedItem.moving_time)}</p>
              </div>
            </div>

            {groupBy === 'individual' && selectedItem.map?.summary_polyline && (
              <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "16px", overflow: "hidden", border: "1px solid #333340" }}>
                <ActivityMap polyline={selectedItem.map.summary_polyline} />
              </div>
            )}

            {groupBy !== 'individual' && selectedItem.activities && (
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-primary)", fontWeight: "600" }}>Included Activities</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {selectedItem.activities.map((a: any) => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#252530", borderRadius: "12px", border: "1px solid #333340" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontSize: "1.5rem" }}>{getActivityIcon(a.type)}</span>
                        <div>
                          <p style={{ fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.1rem" }}>{a.name}</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{new Date(a.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.1rem" }}>{formatDistance(a.distance)}</p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{formatTime(a.moving_time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PR Modal Overlay */}
      {isPRModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1rem" }} onClick={() => setIsPRModalOpen(false)}>
          <div style={{ background: "#1a1a24", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", position: "relative", border: "1px solid var(--surface-border)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsPRModalOpen(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "rgba(255,255,255,0.1)", border: "none", color: "var(--text-secondary)", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
              &times;
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "2.5rem", background: "rgba(252, 76, 2, 0.1)", padding: "1rem", borderRadius: "16px", color: "var(--accent-color)" }}>🏆</span>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: "600" }}>My Personal Records</h2>
                <p style={{ margin: "0.2rem 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your best performances across all activities</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {Object.entries(personalRecords).map(([category, records]) => (
                <div key={category}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--surface-border)" }}>
                    <h3 style={{ margin: 0, color: "var(--accent-color)", fontSize: "1.1rem" }}>{category}</h3>
                    <button 
                      onClick={() => {
                        const name = prompt(`Enter new exercise for ${category}:`);
                        if (name) {
                          savePRs({ ...personalRecords, [category]: [...records, { name, value: "" }] });
                        }
                      }}
                      style={{ background: "transparent", border: "1px solid var(--surface-border)", color: "var(--text-secondary)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      + Add Record
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                    {records.map((record, index) => (
                      <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", background: "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "8px" }}>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "500" }}>{record.name}</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 12.5s or 100kg"
                          value={record.value}
                          onChange={(e) => {
                            const updated = [...records];
                            updated[index].value = e.target.value;
                            savePRs({ ...personalRecords, [category]: updated });
                          }}
                          style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--surface-border)", color: "var(--text-primary)", padding: "0.2rem 0", fontSize: "1rem", outline: "none" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                const category = prompt("Enter new category name:");
                if (category && !personalRecords[category]) {
                  savePRs({ ...personalRecords, [category]: [] });
                }
              }}
              style={{ width: "100%", padding: "1rem", marginTop: "2rem", background: "rgba(255,255,255,0.05)", border: "1px dashed var(--surface-border)", color: "var(--text-secondary)", borderRadius: "12px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", transition: "all 0.2s" }}
            >
              + Add New Category
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
