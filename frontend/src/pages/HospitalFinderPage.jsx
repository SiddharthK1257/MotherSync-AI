import React, { useState, useEffect } from 'react';
import { hospitalAPI } from '../services/api';
import {
  Hospital,
  MapPin,
  PhoneCall,
  Navigation,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';

export const HospitalFinderPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(15000);
  const [userLocation, setUserLocation] = useState({ lat: 37.7749, lng: -122.4194 });

  useEffect(() => {
    // Attempt live geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          fetchHospitals(coords.lat, coords.lng, radius);
        },
        () => {
          fetchHospitals(userLocation.lat, userLocation.lng, radius);
        }
      );
    } else {
      fetchHospitals(userLocation.lat, userLocation.lng, radius);
    }
  }, [radius]);

  const fetchHospitals = async (lat, lng, rad) => {
    setLoading(true);
    try {
      const res = await hospitalAPI.getNearbyHospitals(lat, lng, rad);
      if (res.data.success) {
        setHospitals(res.data.data);
      }
    } catch (err) {
      console.error('Fetch hospitals error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Hospital className="h-6 w-6 text-teal-600" />
            <span>24/7 Maternity Hospital & Emergency Locator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time proximity discovery for maternal emergency rooms, Level IV NICUs & Obstetric delivery units
          </p>
        </div>

        {/* Radius Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Compass className="h-4 w-4 text-teal-600" />
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value={5000}>Within 5 km (~3 miles)</option>
            <option value={15000}>Within 15 km (~10 miles)</option>
            <option value={30000}>Within 30 km (~20 miles)</option>
          </select>
        </div>
      </div>

      {/* Emergency Hotline Alert */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-2xl animate-pulse">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Experiencing Acute Pain, Bleeding, or Fluid Leakage?</h3>
            <p className="text-xs text-red-100">Do not wait for an appointment. Proceed directly to the nearest hospital triage or call 911 immediately.</p>
          </div>
        </div>

        <a
          href="tel:911"
          className="px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center gap-2"
        >
          <PhoneCall className="h-4 w-4" />
          <span>Call 911 / 112 Emergency</span>
        </a>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((hosp, idx) => (
          <div
            key={hosp.id || idx}
            className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 relative overflow-hidden group hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {hosp.type || 'Maternity & Obstetric Hospital'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">{hosp.name}</h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                    {hosp.distanceKm} km
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{hosp.distanceMiles} miles</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>{hosp.address}</span>
              </p>

              {/* Specialties / Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(hosp.specialties || ['Labor & Delivery', 'NICU', '24/7 OB Triage']).map((spec, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100 font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <a
                href={`tel:${hosp.phone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5 text-teal-600" />
                <span>Call Ward</span>
              </a>

              <a
                href={hosp.directionsUrl || `https://maps.google.com/?q=${encodeURIComponent(hosp.name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Get Directions</span>
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default HospitalFinderPage;
