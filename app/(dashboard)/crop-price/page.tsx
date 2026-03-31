"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, MapPin, IndianRupee, ArrowRight, Sparkles, Info } from "lucide-react";

interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  price_change?: number;
}

const COMMODITIES = ["Rice", "Wheat", "Cotton", "Corn", "Soybean", "Sugarcane", "Potato", "Onion", "Tomato"];
const STATES = ["Tamil_Nadu", "Maharashtra", "Punjab", "Karnataka", "Madhya_Pradesh", "Gujarat", "Uttar_Pradesh", "Haryana", "Rajasthan", "Kerala"];

const DEMO_DATA: MandiPrice[] = [
  // Tamil Nadu - Rice
  { state: "Tamil_Nadu", district: "Chennai", market: "Chennai Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2100, max_price: 2400, modal_price: 2250, price_change: 150 },
  { state: "Tamil_Nadu", district: "Coimbatore", market: "Coimbatore Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2000, max_price: 2300, modal_price: 2150, price_change: -50 },
  { state: "Tamil_Nadu", district: "Madurai", market: "Madurai Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2150, max_price: 2450, modal_price: 2300, price_change: 200 },
  { state: "Tamil_Nadu", district: "Trichy", market: "Trichy Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2050, max_price: 2350, modal_price: 2200, price_change: 100 },
  { state: "Tamil_Nadu", district: "Namakkal", market: "Rasipuram Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2080, max_price: 2380, modal_price: 2230, price_change: 80 },
  { state: "Tamil_Nadu", district: "Theni", market: "Theni Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2120, max_price: 2420, modal_price: 2270, price_change: 120 },
  // Maharashtra - Rice
  { state: "Maharashtra", district: "Mumbai", market: "Vashi Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2200, max_price: 2500, modal_price: 2350, price_change: 250 },
  { state: "Maharashtra", district: "Pune", market: "Pune Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2150, max_price: 2450, modal_price: 2300, price_change: 0 },
  { state: "Maharashtra", district: "Nagpur", market: "Nagpur Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2100, max_price: 2400, modal_price: 2250, price_change: 100 },
  { state: "Maharashtra", district: "Nashik", market: "Nashik Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2180, max_price: 2480, modal_price: 2330, price_change: 180 },
  // Punjab - Wheat
  { state: "Punjab", district: "Ludhiana", market: "Ludhiana Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2400, max_price: 2700, modal_price: 2550, price_change: 300 },
  { state: "Punjab", district: "Amritsar", market: "Amritsar Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2350, max_price: 2650, modal_price: 2500, price_change: 180 },
  { state: "Punjab", district: "Patiala", market: "Patiala Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2380, max_price: 2680, modal_price: 2530, price_change: 220 },
  { state: "Punjab", district: "Jalandhar", market: "Jalandhar Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2420, max_price: 2720, modal_price: 2570, price_change: 320 },
  // Karnataka - Cotton
  { state: "Karnataka", district: "Mysore", market: "Mysore Mandi", commodity: "Cotton", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 6200, max_price: 6800, modal_price: 6500, price_change: 400 },
  { state: "Karnataka", district: "Bellary", market: "Bellary Mandi", commodity: "Cotton", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 6000, max_price: 6600, modal_price: 6300, price_change: 200 },
  { state: "Karnataka", district: "Hubli", market: "Hubli Mandi", commodity: "Cotton", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 6100, max_price: 6700, modal_price: 6400, price_change: 300 },
  // Gujarat - Cotton
  { state: "Gujarat", district: "Ahmedabad", market: "Ahmedabad Mandi", commodity: "Cotton", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 6300, max_price: 6900, modal_price: 6600, price_change: 500 },
  { state: "Gujarat", district: "Surat", market: "Surat Mandi", commodity: "Cotton", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 6150, max_price: 6750, modal_price: 6450, price_change: 350 },
  // Madhya Pradesh - Soybean
  { state: "Madhya_Pradesh", district: "Bhopal", market: "Bhopal Mandi", commodity: "Soybean", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 4500, max_price: 5200, modal_price: 4850, price_change: 250 },
  { state: "Madhya_Pradesh", district: "Indore", market: "Indore Mandi", commodity: "Soybean", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 4400, max_price: 5100, modal_price: 4750, price_change: 150 },
  // Uttar Pradesh - Wheat
  { state: "Uttar_Pradesh", district: "Lucknow", market: "Lucknow Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2450, max_price: 2750, modal_price: 2600, price_change: 350 },
  { state: "Uttar_Pradesh", district: "Kanpur", market: "Kanpur Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2400, max_price: 2700, modal_price: 2550, price_change: 280 },
  // Haryana - Wheat
  { state: "Haryana", district: "Gurgaon", market: "Gurgaon Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2430, max_price: 2730, modal_price: 2580, price_change: 330 },
  { state: "Haryana", district: "Hisar", market: "Hisar Mandi", commodity: "Wheat", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2380, max_price: 2680, modal_price: 2530, price_change: 250 },
  // Kerala - Rice (high prices)
  { state: "Kerala", district: "Thiruvananthapuram", market: "Thiruvananthapuram Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2800, max_price: 3200, modal_price: 3000, price_change: 500 },
  { state: "Kerala", district: "Kochi", market: "Kochi Mandi", commodity: "Rice", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2750, max_price: 3150, modal_price: 2950, price_change: 450 },
  // Maharashtra - Onion
  { state: "Maharashtra", district: "Nashik", market: "Lasalgaon Mandi", commodity: "Onion", variety: "Red", arrival_date: new Date().toISOString().split('T')[0], min_price: 1500, max_price: 2200, modal_price: 1850, price_change: -300 },
  { state: "Maharashtra", district: "Pune", market: "Pune Mandi", commodity: "Onion", variety: "Red", arrival_date: new Date().toISOString().split('T')[0], min_price: 1600, max_price: 2300, modal_price: 1950, price_change: -250 },
  // Rajasthan - Onion
  { state: "Rajasthan", district: "Jaipur", market: "Jaipur Mandi", commodity: "Onion", variety: "Red", arrival_date: new Date().toISOString().split('T')[0], min_price: 1400, max_price: 2100, modal_price: 1750, price_change: -350 },
  // Uttar Pradesh - Potato
  { state: "Uttar_Pradesh", district: "Agra", market: "Agra Mandi", commodity: "Potato", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 1200, max_price: 1800, modal_price: 1500, price_change: 100 },
  { state: "Uttar_Pradesh", district: "Lucknow", market: "Lucknow Mandi", commodity: "Potato", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 1150, max_price: 1750, modal_price: 1450, price_change: 50 },
  // Madhya Pradesh - Potato
  { state: "Madhya_Pradesh", district: "Bhopal", market: "Bhopal Mandi", commodity: "Potato", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 1100, max_price: 1700, modal_price: 1400, price_change: 0 },
  // Karnataka - Tomato
  { state: "Karnataka", district: "Bangalore", market: "Bangalore Mandi", commodity: "Tomato", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 2000, max_price: 3500, modal_price: 2750, price_change: 800 },
  { state: "Karnataka", district: "Mysore", market: "Mysore Mandi", commodity: "Tomato", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 1800, max_price: 3200, modal_price: 2500, price_change: 600 },
  // Maharashtra - Tomato  
  { state: "Maharashtra", district: "Pune", market: "Pune Mandi", commodity: "Tomato", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 1900, max_price: 3400, modal_price: 2650, price_change: 700 },
  // Tamil Nadu - Sugarcane
  { state: "Tamil_Nadu", district: "Madurai", market: "Madurai Mandi", commodity: "Sugarcane", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 3500, max_price: 4000, modal_price: 3750, price_change: 150 },
  { state: "Tamil_Nadu", district: "Coimbatore", market: "Coimbatore Mandi", commodity: "Sugarcane", variety: "Common", arrival_date: new Date().toISOString().split('T')[0], min_price: 3400, max_price: 3900, modal_price: 3650, price_change: 100 },
];

export default function CropPricePage() {
  const [commodity, setCommodity] = useState("Rice");
  const [state, setState] = useState("Tamil_Nadu");
  const [data, setData] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [useDemo, setUseDemo] = useState(true);

  useEffect(() => {
    fetchPrices();
  }, [commodity, state]);

  const fetchPrices = async () => {
    setLoading(true);
    if (useDemo || !apiKey) {
      await new Promise(r => setTimeout(r, 800));
      const filtered = DEMO_DATA.filter(d => 
        d.commodity === commodity && 
        (state === "All" || d.state === state)
      );
      setData(filtered.length ? filtered : DEMO_DATA.filter(d => d.commodity === commodity));
      setLoading(false);
      return;
    }

    try {
      const resourceId = "9ef273d6-b1da-4573-bc9a-9ef854371424";
      const url = `https://api.datagov.in/resource/${resourceId}?api-key=${apiKey}&format=json&filters[state]=${state}&filters[commodity]=${commodity}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.records) {
        setData(json.records);
      }
    } catch (err) {
      console.error("API Error:", err);
    }
    setLoading(false);
  };

  const bestMarket = data.length ? [...data].sort((a, b) => b.modal_price - a.modal_price)[0] : null;
  const avgPrice = data.length ? Math.round(data.reduce((sum, d) => sum + d.modal_price, 0) / data.length) : 0;

  const getPrediction = () => {
    if (!bestMarket) return null;
    const hasRisingTrend = data.some(d => (d.price_change || 0) > 0);
    const highPrice = bestMarket.modal_price > avgPrice * 1.1;
    
    if (hasRisingTrend && highPrice) {
      return { text: "Prices trending upward! Consider selling soon.", type: "up" as const };
    }
    if ((bestMarket.price_change || 0) < -100) {
      return { text: "Price drop detected. Market may recover soon.", type: "down" as const };
    }
    return { text: "Market stable. Hold for better rates.", type: "stable" as const };
  };

  const prediction = getPrediction();

  return (
    <div>
      <div className="page-title">Crop Prices</div>
      <div className="page-subtitle">Live mandi prices from across India with smart recommendations</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="field-label">Commodity</label>
            <select className="field-select" value={commodity} onChange={(e) => setCommodity(e.target.value)}>
              {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="field-label">State</label>
            <select className="field-select" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="All">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="field-label">API Key (optional)</label>
            <input 
              type="password" 
              className="field-input" 
              placeholder="Enter API key for live data"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8 }}>
            <input type="checkbox" checked={useDemo} onChange={(e) => setUseDemo(e.target.checked)} />
            <span style={{ fontSize: 13 }}>Demo Mode</span>
          </label>
        </div>
      </div>

      {bestMarket && (
        <div className="card" style={{ marginBottom: 20, border: '2px solid #22c55e', background: 'linear-gradient(135deg, #22c55e10 0%, #16a34110 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Best Market</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{bestMarket.market}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{bestMarket.district}, {bestMarket.state.replace(/_/g, ' ')}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>₹{bestMarket.modal_price}</div>
              <div style={{ fontSize: 12, color: '#888' }}>per quintal</div>
              {bestMarket.price_change !== undefined && bestMarket.price_change !== 0 && (
                <div style={{ fontSize: 13, color: bestMarket.price_change > 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  {bestMarket.price_change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  ₹{Math.abs(bestMarket.price_change)} since yesterday
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {prediction && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid #3b82f6', background: '#3b82f610' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>🔮</span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Smart Prediction</div>
              <div style={{ fontSize: 14, color: '#fff' }}>{prediction.text}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-title">{commodity} Prices in {state === "All" ? "All States" : state.replace(/_/g, ' ')}</div>
        <div style={{ fontSize: 13, color: '#888' }}>{data.length} mandis found • Avg: ₹{avgPrice}</div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : (
        <div className="grid-2">
          {data.map((mandi, idx) => (
            <div key={idx} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{mandi.market}</div>
                  <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {mandi.district}, {mandi.state.replace(/_/g, ' ')}
                  </div>
                </div>
                {mandi.price_change !== undefined && mandi.price_change !== 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    padding: '4px 8px', 
                    borderRadius: 6, 
                    background: mandi.price_change > 0 ? '#22c55e20' : '#ef444420',
                    fontSize: 12,
                    color: mandi.price_change > 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {mandi.price_change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    ₹{Math.abs(mandi.price_change)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Modal Price</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>₹{mandi.modal_price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Range</div>
                  <div style={{ fontSize: 13, color: '#888' }}>₹{mandi.min_price} - ₹{mandi.max_price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <Info size={32} style={{ color: '#666', marginBottom: 12 }} />
          <div style={{ fontSize: 15, color: '#888' }}>No data found for selected filters</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>Try changing commodity or state, or enable Demo Mode</div>
        </div>
      )}
    </div>
  );
}
