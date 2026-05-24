import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const MAX_DISTANCES = [5, 10, 20, 30];
const MIN_LAT = -90, MAX_LAT = 90, MIN_LNG = -180, MAX_LNG = 180;

export default function ProjectCreator() {
  const { companies, generatePlan, loading } = useProject();
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [projectName, setProjectName] = useState('');
  const [cityOverride, setCityOverride] = useState('');
  const [stateOverride, setStateOverride] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [maxDistance, setMaxDistance] = useState(10);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      });
    }
  }, []);

  const validateCoordinates = () => {
    if (lat < MIN_LAT || lat > MAX_LAT) {
      return 'Latitude must be between -90 and 90';
    }
    if (lng < MIN_LNG || lng > MAX_LNG) {
      return 'Longitude must be between -180 and 180';
    }
    if (!selectedCompany) {
      return 'Please select a company';
    }
    return '';
  };

  const handleGenerate = async () => {
    setError('');
    setValidationError('');
    
    const validation = validateCoordinates();
    if (validation) {
      setValidationError(validation);
      return;
    }

    try {
      await generatePlan({
        latitude: lat,
        longitude: lng,
        project_name: projectName || undefined,
        selected_company: selectedCompany,
        city: cityOverride || undefined,
        state: stateOverride || undefined,
        max_tower_distance_km: maxDistance,
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Generation failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Project Creator</h1>
      <div className="glass p-6 max-w-xl space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex gap-2"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}</div>}
        {validationError && <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-sm flex gap-2"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{validationError}</div>}
        
        <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name (optional)" className="input-field" />
        
        <div>
          <label className="text-sm text-gray-600 mb-1 block font-medium">Source Location</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input type="number" step="0.0001" min={MIN_LAT} max={MAX_LAT} value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} className="input-field text-sm" placeholder="Latitude" />
              <p className="text-xs text-gray-500 mt-1">-90 to 90</p>
            </div>
            <div>
              <input type="number" step="0.0001" min={MIN_LNG} max={MAX_LNG} value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} className="input-field text-sm" placeholder="Longitude" />
              <p className="text-xs text-gray-500 mt-1">-180 to 180</p>
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-sm text-gray-600 mb-1 block font-medium">Select Company *</label>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className={`input-field ${!selectedCompany ? 'border-orange-300' : ''}`}>
            <option value="">-- Select a company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.company_name}>{c.company_name} — {c.admin_name}</option>
            ))}
          </select>
          {companies.length === 0 && (
            <p className="text-xs text-orange-600 mt-1">No companies registered yet. Contact administrator.</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <input value={cityOverride} onChange={(e) => setCityOverride(e.target.value)} placeholder="Override City (optional)" className="input-field text-sm" />
          <input value={stateOverride} onChange={(e) => setStateOverride(e.target.value)} placeholder="Override State (optional)" className="input-field text-sm" />
        </div>
        
        <div>
          <label className="text-sm text-gray-600 mb-1 block font-medium">Max Tower Distance (km)</label>
          <select value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="input-field">
            {MAX_DISTANCES.map((d) => <option key={d} value={d}>{d} km</option>)}
          </select>
        </div>
        
        <div className="bg-lavender-50 border border-lavender-200 p-3 rounded-lg text-sm text-lavender-700">
          <p className="font-medium mb-1">ℹ️ Auto-Detection</p>
          <p>City, terrain, and currency will be automatically detected from your location coordinates.</p>
        </div>
        
        <button 
          onClick={handleGenerate} 
          disabled={loading || !selectedCompany} 
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 
          {loading ? 'Generating...' : 'Generate AI Plan'}
        </button>
      </div>
    </div>
  );
}
