

import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from "react-router-dom";
import { getInitialLocation } from "../services/geolocationService";
import { reverseGeocode } from "../services/reverseGeocodeService";
import districts from '../data/districts.json';
import districtsCoords from '../data/districts_coords.json';
import { TransportService } from "../services/transportService";
import { Loader } from "./Loader";
import { ErrorDisplay } from "./ErrorDisplay";
import { ItineraryMap } from "./ItineraryMap";
// (imported above if needed)
import type { Location, TransportData } from "../types";

const GeoTransitLive: React.FC = () => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [transportData, setTransportData] = useState<TransportData | null>(null);
  const [search, setSearch] = useState('');
  const [budget, setBudget] = useState<'Economy' | 'Moderate' | 'Luxury'>('Moderate');
  const [numPeople, setNumPeople] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Jharkhand capital coordinates (Ranchi)
  const jharkhandCoords = { latitude: 23.3441, longitude: 85.3096 };
  // Get preferred district coordinates
  const preferredDistrictCoords = selectedDistrict
    ? (districtsCoords as any[]).find((d) => d.id === selectedDistrict)
    : null;
  // Fallback to Ranchi if no preference or missing coords
  const destCoords = preferredDistrictCoords && preferredDistrictCoords.latitude && preferredDistrictCoords.longitude
    ? { latitude: preferredDistrictCoords.latitude, longitude: preferredDistrictCoords.longitude }
    : jharkhandCoords;
  // Example travel apps/websites
  const travelApps = [
    { name: 'IRCTC Rail Connect', url: 'https://www.irctc.co.in/' },
    { name: 'MakeMyTrip', url: 'https://www.makemytrip.com/' },
    { name: 'RedBus', url: 'https://www.redbus.in/' },
    { name: 'Goibibo', url: 'https://www.goibibo.com/' },
    { name: 'Yatra', url: 'https://www.yatra.com/' },
    { name: 'IXIGO Trains & Flights', url: 'https://www.ixigo.com/' },
    { name: 'Google Maps', url: 'https://maps.google.com/' },
  ];

  const transportService = new TransportService(import.meta.env.VITE_GEMINI_API_KEY || "");

  const handleFetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coords = await getInitialLocation();
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? 0,
      });
      // Fetch address
      const addr = await reverseGeocode(coords.latitude, coords.longitude);
      setAddress(addr);
      const data = await transportService.fetchTransportData(coords.latitude, coords.longitude);
      setTransportData(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setTransportData(null);
      setLocation(null);
      setAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [transportService]);

  useEffect(() => {
    handleFetchData();
    // eslint-disable-next-line
  }, []);

  // Distance-based dynamic travel expenses
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  let distanceKm = 0;
  if (location && destCoords) {
    distanceKm = haversineDistance(location.latitude, location.longitude, destCoords.latitude, destCoords.longitude);
  }

  // Per-km rates (INR/km) for each mode and budget
  const perKmRates = {
    Economy: { Train: 1.2, Bus: 0.9, Flight: 5 },
    Moderate: { Train: 2, Bus: 1.5, Flight: 7 },
    Luxury: { Train: 2.5, Bus: 1.8, Flight: 10 },
  };
  const rates = perKmRates[budget];
  // Minimum fares for short distances
  const minFares = { Train: 300, Bus: 200, Flight: 2500 };
  const expenses = {
    Train: Math.max(Math.round(rates.Train * distanceKm), minFares.Train) * numPeople,
    Bus: Math.max(Math.round(rates.Bus * distanceKm), minFares.Bus) * numPeople,
    Flight: Math.max(Math.round(rates.Flight * distanceKm), minFares.Flight) * numPeople,
  };
  // Filtered stops/routes
  const filteredStops = transportData && search.trim()
    ? transportData.stops.filter(stop =>
        stop.name.toLowerCase().includes(search.toLowerCase()) ||
        stop.routes.some(route => route.name.toLowerCase().includes(search.toLowerCase()) || route.destination.toLowerCase().includes(search.toLowerCase()))
      )
    : transportData?.stops || [];

  return (
    <div className="bg-[#fdf8f3] min-h-screen text-black font-sans flex flex-col items-center p-0 sm:p-8 relative">
      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 px-4 py-2 bg-peach-700 text-white rounded-lg shadow hover:bg-peach-800 transition-colors duration-200 font-semibold z-10"
      >
        ← Back to Home
      </Link>

      {/* Hero Section */}
      <section className="w-full geotransit-hero bg-gradient-to-br from-green-400 via-green-500 to-green-700 py-16 px-4 text-center text-white mb-8">
        <h1 className="text-5xl font-extrabold mb-4 page-title">GeoTransit Live</h1>
        <p className="text-xl opacity-90 max-w-xl mx-auto section-subtitle">
          Find live public transport options near you using your current location.
        </p>
      </section>

      {/* Show current address */}
  <div className="w-full max-w-3xl mx-auto mb-6 flex flex-col gap-3">
        {/* Budget and people controls */}
        <div className="flex flex-wrap gap-4 items-center bg-white border border-green-200 rounded-lg p-4 shadow">
          <label className="font-semibold text-green-700">Budget:
            <select value={budget} onChange={e => setBudget(e.target.value as any)} className="ml-2 border rounded px-2 py-1">
              <option value="Economy">Economy</option>
              <option value="Moderate">Moderate</option>
              <option value="Luxury">Luxury</option>
            </select>
          </label>
          <label className="font-semibold text-green-700">Number of People:
            <input type="number" min={1} value={numPeople} onChange={e => setNumPeople(Number(e.target.value))} className="ml-2 border rounded px-2 py-1 w-16" />
          </label>
        </div>
        {address && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-2 text-green-900 shadow">
            <span className="font-semibold">Your current address:</span> <span>{address}</span>
          </div>
        )}
      </div>

      {/* Ask for destination preference */}
      <div className="w-full max-w-3xl mx-auto mb-6">
        <div className="bg-white border border-green-200 rounded-lg p-4 shadow">
          <span className="font-semibold text-green-700">Where do you want to go in Jharkhand?</span>
          <div className="mt-3 flex flex-wrap gap-3">
            {districts.map((d: any) => (
              <button
                key={d.id}
                className={`px-4 py-2 rounded-full border font-semibold transition-colors ${selectedDistrict === d.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-100'}`}
                onClick={() => setSelectedDistrict(d.id)}
              >
                {d.name}
              </button>
            ))}
            <button
              className={`px-4 py-2 rounded-full border font-semibold transition-colors ${selectedDistrict === null ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-100'}`}
              onClick={() => setSelectedDistrict(null)}
            >
              No Preference (Show all ways to Ranchi)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-container grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 w-full max-w-6xl px-2 sm:px-6 mb-8">
        {/* Transport Cards List */}
        <div>
          {/* Search Bar */}
          <div className="search-container relative mb-6">
            <input
              type="text"
              placeholder="Search stops or routes..."
              className="search-input w-full py-4 px-6 rounded-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 text-lg transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isLoading && <Loader />}
          {error && <ErrorDisplay message={error} onRetry={handleFetchData} />}
          {!isLoading && !error && filteredStops && (
            <ul className="space-y-6">
              {filteredStops.length === 0 && (
                <li className="text-center text-gray-400">No stops or routes found.</li>
              )}
              {filteredStops.map((stop) => (
                <li key={stop.id} className="transport-card bg-white rounded-2xl shadow-xl p-6 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-2xl text-green-700">{stop.name}</div>
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wide">{stop.type}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Lat: {stop.location.latitude}, Lon: {stop.location.longitude}</div>
                  <a href={stop.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline text-sm font-medium">Book Now</a>
                  <div className="mt-3">
                    <span className="font-semibold text-base">Routes:</span>
                    <ul className="ml-4 mt-2 space-y-1">
                      {stop.routes.map((route) => (
                        <li key={route.id} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-800">{route.name}</span>
                          <span className="text-gray-500">→ {route.destination}</span>
                          {/* Route Status Indicator */}
                          <span className={`route-status ${route.arrivesInMinutes <= 3 ? 'arriving-soon' : route.arrivesInMinutes <= 10 ? 'moderate-wait' : 'long-wait'}`}>{route.arrivesInMinutes <= 3 ? 'Arriving Soon' : route.arrivesInMinutes <= 10 ? 'Moderate Wait' : 'Long Wait'}</span>
                          <span className="text-xs text-gray-400">({route.arrivesInMinutes} min)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Map/Sidebar Placeholder */}
        <div className="map-container bg-white rounded-3xl shadow-2xl border-4 border-white flex flex-col items-center justify-start p-6 gap-6 relative">
          {/* Show route from current location to Jharkhand */}
          {location ? (
            <>
              <button
                className="mb-3 px-7 py-3 bg-green-800 bg-opacity-95 text-white font-bold text-lg rounded-xl border-2 border-white shadow-2xl hover:bg-green-900 hover:scale-105 transition-all duration-200 self-center"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
                onClick={() => setShowMapModal(true)}
              >
                View Map
              </button>
              <div className="w-full">
                <MapContainer
                  center={[(location.latitude + destCoords.latitude) / 2, (location.longitude + destCoords.longitude) / 2] as LatLngExpression}
                  zoom={5}
                  scrollWheelZoom={true}
                  className="w-full h-80 rounded-2xl shadow-lg"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[location.latitude, location.longitude]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  <Marker position={[destCoords.latitude, destCoords.longitude]}>
                    <Popup>{selectedDistrict ? (preferredDistrictCoords?.name || 'Selected District') : 'Jharkhand (Ranchi)'}</Popup>
                  </Marker>
                  <Polyline pathOptions={{ color: 'blue' }} positions={[[location.latitude, location.longitude], [destCoords.latitude, destCoords.longitude]]} />
                </MapContainer>
              </div>
            </>
          ) : (
            <span className="text-gray-400">[Map or additional info here]</span>
          )}
      {/* Fullscreen Map Modal */}
      {showMapModal && location && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <MapContainer
              center={[(location.latitude + destCoords.latitude) / 2, (location.longitude + destCoords.longitude) / 2] as LatLngExpression}
              zoom={6}
              scrollWheelZoom={true}
              className="w-full h-[80vh] rounded-2xl shadow-2xl"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[location.latitude, location.longitude]}>
                <Popup>Your Location</Popup>
              </Marker>
              <Marker position={[destCoords.latitude, destCoords.longitude]}>
                <Popup>{selectedDistrict ? (preferredDistrictCoords?.name || 'Selected District') : 'Jharkhand (Ranchi)'}</Popup>
              </Marker>
              <Polyline pathOptions={{ color: 'blue' }} positions={[[location.latitude, location.longitude], [destCoords.latitude, destCoords.longitude]]} />
            </MapContainer>
            {/* Close button moved outside MapContainer for visibility */}
          </div>
          <button
            className="fixed top-8 right-12 px-7 py-3 bg-red-700 text-white font-bold text-lg rounded-xl border-2 border-white shadow-2xl hover:bg-red-800 hover:scale-105 transition-all duration-200 z-[1100]"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
            onClick={() => setShowMapModal(false)}
          >
            Close
          </button>
        </div>
      )}
          {/* Travel expense estimate */}
          {location && (
            <div className="mt-4 flex justify-center">
              <div className="bg-green-50 border border-green-200 rounded-xl shadow p-6 w-full max-w-lg text-left">
                <div className="font-bold text-green-800 text-lg mb-3 text-center">
                  Estimated Travel Expenses ({budget}, {numPeople} {numPeople === 1 ? 'person' : 'people'})
                  <div className="text-gray-700 text-base mt-1">Distance: <span className="font-semibold">{distanceKm ? distanceKm.toFixed(1) : '--'} km</span></div>
                </div>
                {/* Train */}
                {(() => {
                  // Per-km rates and food by budget
                  const trainRates = {
                    Economy: { sleeper: 0.35, ac3: 1.1, food: [200, 350] },
                    Moderate: { sleeper: 0.45, ac3: 1.5, food: [300, 500] },
                    Luxury: { sleeper: 0.7, ac3: 2.2, food: [500, 900] },
                  };
                  const { sleeper, ac3, food } = trainRates[budget];
                  const sleeperCost = Math.round(distanceKm * sleeper) * numPeople;
                  const ac3Cost = Math.round(distanceKm * ac3) * numPeople;
                  const foodMin = food[0] * numPeople, foodMax = food[1] * numPeople;
                  const trainMin = sleeperCost + foodMin;
                  const trainMax = ac3Cost + foodMax;
                  return (
                    <div className="mb-4">
                      <div className="font-semibold text-base mb-1">🚆 By Train ({budget} Class – Sleeper / 3AC mix)</div>
                      <ul className="ml-4 text-sm text-green-900 list-disc">
                        <li><b>Sleeper Class</b>: ₹{sleeperCost.toLocaleString()} + food</li>
                        <li><b>3rd AC (3AC)</b>: ₹{ac3Cost.toLocaleString()} + food</li>
                        <li><b>Food & water (on the way)</b>: ₹{foodMin.toLocaleString()} – ₹{foodMax.toLocaleString()}</li>
                      </ul>
                      <div className="mt-1 text-green-800 font-semibold">✅ Total ({budget.toLowerCase()} mix): ~₹{trainMin.toLocaleString()} – ₹{trainMax.toLocaleString()}</div>
                    </div>
                  );
                })()}
                {/* Bus */}
                {(() => {
                  // Per-km rates and food by budget
                  const busRates = {
                    Economy: { nonAc: 0.7, ac: 1.2, food: [200, 350] },
                    Moderate: { nonAc: 1.0, ac: 1.7, food: [300, 500] },
                    Luxury: { nonAc: 1.5, ac: 2.5, food: [500, 900] },
                  };
                  const { nonAc, ac, food } = busRates[budget];
                  const nonAcCost = Math.round(distanceKm * nonAc) * numPeople;
                  const acCost = Math.round(distanceKm * ac) * numPeople;
                  const foodMin = food[0] * numPeople, foodMax = food[1] * numPeople;
                  const busMin = nonAcCost + foodMin;
                  const busMax = acCost + foodMax;
                  return (
                    <div className="mb-4">
                      <div className="font-semibold text-base mb-1">🚌 By Bus (Semi-sleeper/AC, {budget})</div>
                      <ul className="ml-4 text-sm text-green-900 list-disc">
                        <li><b>Non-AC Sleeper</b>: ₹{nonAcCost.toLocaleString()} + snacks</li>
                        <li><b>AC Sleeper</b>: ₹{acCost.toLocaleString()} + snacks</li>
                        <li><b>Snacks/Meals</b>: ₹{foodMin.toLocaleString()} – ₹{foodMax.toLocaleString()}</li>
                      </ul>
                      <div className="mt-1 text-green-800 font-semibold">✅ Total ({budget.toLowerCase()}): ~₹{busMin.toLocaleString()} – ₹{busMax.toLocaleString()}</div>
                    </div>
                  );
                })()}
                {/* Car */}
                {(() => {
                  // Car: mileage, petrol price, tolls, food by budget
                  const carRates = {
                    Economy: { mileage: 18, petrol: 95, toll: [400, 700], food: [200, 400] },
                    Moderate: { mileage: 15, petrol: 100, toll: [600, 1000], food: [400, 700] },
                    Luxury: { mileage: 10, petrol: 110, toll: [1000, 1800], food: [700, 1500] },
                  };
                  const { mileage, petrol, toll, food } = carRates[budget];
                  const fuel = Math.round((distanceKm / mileage) * petrol) * numPeople;
                  const tollMin = toll[0] * numPeople, tollMax = toll[1] * numPeople;
                  const foodMin = food[0] * numPeople, foodMax = food[1] * numPeople;
                  const carMin = fuel + tollMin + foodMin;
                  const carMax = fuel + tollMax + foodMax;
                  return (
                    <div className="mb-4">
                      <div className="font-semibold text-base mb-1">🚗 By Car (Self-drive / Taxi, {budget})</div>
                      <ul className="ml-4 text-sm text-green-900 list-disc">
                        <li>Fuel = <span className="font-mono">({distanceKm ? distanceKm.toFixed(1) : '--'} / {mileage}) × {petrol} ≈ ₹{fuel.toLocaleString()}</span></li>
                        <li>Tolls = ₹{tollMin.toLocaleString()} – ₹{tollMax.toLocaleString()}</li>
                        <li>Food = ₹{foodMin.toLocaleString()} – ₹{foodMax.toLocaleString()}</li>
                      </ul>
                      <div className="mt-1 text-green-800 font-semibold">✅ Total: ~₹{carMin.toLocaleString()} – ₹{carMax.toLocaleString()}</div>
                    </div>
                  );
                })()}
                {/* Flight */}
                {(() => {
                  // Flight: estimate by distance band and budget
                  let flightMin = 3500, flightMax = 7000, localMin = 300, localMax = 700;
                  if (distanceKm < 500) { flightMin = 2500; flightMax = 5000; }
                  else if (distanceKm > 1500) { flightMin = 5000; flightMax = 12000; }
                  if (budget === 'Economy') { flightMin -= 500; flightMax -= 1000; }
                  if (budget === 'Luxury') { flightMin += 2000; flightMax += 4000; localMin += 500; localMax += 1000; }
                  flightMin = Math.max(1500, flightMin);
                  const totalMin = (flightMin + localMin) * numPeople;
                  const totalMax = (flightMax + localMax) * numPeople;
                  return (
                    <div className="mb-4">
                      <div className="font-semibold text-base mb-1">🛫 By Flight ({budget})</div>
                      <ul className="ml-4 text-sm text-green-900 list-disc">
                        <li>Flight (one-way economy): ₹{(flightMin * numPeople).toLocaleString()} – ₹{(flightMax * numPeople).toLocaleString()}</li>
                        <li>Local travel (airport to city): ₹{(localMin * numPeople).toLocaleString()} – ₹{(localMax * numPeople).toLocaleString()}</li>
                      </ul>
                      <div className="mt-1 text-green-800 font-semibold">✅ Total: ~₹{totalMin.toLocaleString()} – ₹{totalMax.toLocaleString()}</div>
                    </div>
                  );
                })()}
                {/* Summary */}
                {(() => {
                  // Use above dynamic values for summary
                  // Train
                  const trainRates = {
                    Economy: { sleeper: 0.35, ac3: 1.1, food: [200, 350] },
                    Moderate: { sleeper: 0.45, ac3: 1.5, food: [300, 500] },
                    Luxury: { sleeper: 0.7, ac3: 2.2, food: [500, 900] },
                  };
                  const { sleeper, ac3, food } = trainRates[budget];
                  const sleeperCost = Math.round(distanceKm * sleeper) * numPeople;
                  const ac3Cost = Math.round(distanceKm * ac3) * numPeople;
                  const foodMin = food[0] * numPeople, foodMax = food[1] * numPeople;
                  const trainMin = sleeperCost + foodMin;
                  const trainMax = ac3Cost + foodMax;
                  // Bus
                  const busRates = {
                    Economy: { nonAc: 0.7, ac: 1.2, food: [200, 350] },
                    Moderate: { nonAc: 1.0, ac: 1.7, food: [300, 500] },
                    Luxury: { nonAc: 1.5, ac: 2.5, food: [500, 900] },
                  };
                  const { nonAc, ac, food: busFood } = busRates[budget];
                  const nonAcCost = Math.round(distanceKm * nonAc) * numPeople;
                  const acCost = Math.round(distanceKm * ac) * numPeople;
                  const busFoodMin = busFood[0] * numPeople, busFoodMax = busFood[1] * numPeople;
                  const busMin = nonAcCost + busFoodMin;
                  const busMax = acCost + busFoodMax;
                  // Car
                  const carRates = {
                    Economy: { mileage: 18, petrol: 95, toll: [400, 700], food: [200, 400] },
                    Moderate: { mileage: 15, petrol: 100, toll: [600, 1000], food: [400, 700] },
                    Luxury: { mileage: 10, petrol: 110, toll: [1000, 1800], food: [700, 1500] },
                  };
                  const { mileage, petrol, toll, food: carFood } = carRates[budget];
                  const fuel = Math.round((distanceKm / mileage) * petrol) * numPeople;
                  const tollMin = toll[0] * numPeople, tollMax = toll[1] * numPeople;
                  const carFoodMin = carFood[0] * numPeople, carFoodMax = carFood[1] * numPeople;
                  const carMin = fuel + tollMin + carFoodMin;
                  const carMax = fuel + tollMax + carFoodMax;
                  // Flight
                  let flightMin = 3500, flightMax = 7000, localMin = 300, localMax = 700;
                  if (distanceKm < 500) { flightMin = 2500; flightMax = 5000; }
                  else if (distanceKm > 1500) { flightMin = 5000; flightMax = 12000; }
                  if (budget === 'Economy') { flightMin -= 500; flightMax -= 1000; }
                  if (budget === 'Luxury') { flightMin += 2000; flightMax += 4000; localMin += 500; localMax += 1000; }
                  flightMin = Math.max(1500, flightMin);
                  const flightTotalMin = (flightMin + localMin) * numPeople;
                  const flightTotalMax = (flightMax + localMax) * numPeople;
                  return (
                    <div className="mt-6 p-3 bg-green-100 rounded-lg text-green-900 font-bold text-base">
                      📌 Summary ({budget}, {numPeople} {numPeople === 1 ? 'person' : 'people'}, {distanceKm ? distanceKm.toFixed(1) : '--'} km):<br />
                      <span className="block mt-1">Train (3AC + food) → ~₹{trainMin.toLocaleString()} – ₹{trainMax.toLocaleString()}</span>
                      <span className="block">Bus (AC Sleeper) → ~₹{busMin.toLocaleString()} – ₹{busMax.toLocaleString()}</span>
                      <span className="block">Car → ~₹{carMin.toLocaleString()} – ₹{carMax.toLocaleString()}</span>
                      <span className="block">Flight → ~₹{flightTotalMin.toLocaleString()} – ₹{flightTotalMax.toLocaleString()}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          {/* Recommended travel apps/websites */}
          <div className="mt-6 text-center">
            <span className="block font-extrabold text-green-800 text-xl mb-2" style={{letterSpacing: '0.5px', textShadow: '0 2px 8px #fff'}}>Recommended Apps & Websites:</span>
            <ul className="mt-3 flex flex-wrap gap-3 justify-center">
              {travelApps.map(app => (
                <li key={app.name}>
                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900 font-medium">{app.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="floating-controls fixed bottom-8 right-8 flex flex-col gap-3 z-50">
        <button className="fab flex items-center justify-center" title="Refresh" onClick={handleFetchData}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5 19A9 9 0 1119 5" /></svg>
        </button>
        <button className="fab flex items-center justify-center" title="Camera (coming soon)" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h2l2-3h10l2 3h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" /><circle cx="12" cy="13" r="4" /></svg>
        </button>
      </div>
    </div>
  );
};

export default GeoTransitLive;
