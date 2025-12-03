import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "../../../context/GameContext.jsx";
import "../../../styles/builder/jerry.css";
import "../../../styles/game/common/PersonaCard.css"; // Assuming this styles the main card
import { mapPersonas } from "../../../utils/persona.js";
import PersonaCard from "../../../components/PersonaCard.jsx"; // Assuming this is the full card component

const MAX_SELECTED = 5;

// Helper function to get a random integer
const rand = (n) => Math.floor(Math.random() * n);

// Helper function to sample unique personas, prioritizing role diversity
function sampleUniqueByRole(all, excludeIdsSet, count = 5) {
  const pool = all.filter(p => !excludeIdsSet.has(p.id));
  const byRole = new Map();
  for (const p of pool) {
    if (!byRole.has(p.role)) byRole.set(p.role, []);
    byRole.get(p.role).push(p);
  }

  const roles = [...byRole.keys()].sort(() => Math.random() - 0.5);
  const picked = [];
  const used = new Set();

  // pick one per unique role
  for (const role of roles) {
    if (picked.length >= count) break;
    const arr = byRole.get(role);
    const choice = arr[rand(arr.length)];
    if (!used.has(choice.id)) {
      picked.push(choice);
      used.add(choice.id);
    }
  }

  // fill remaining slots if needed
  if (picked.length < count) {
    const remainder = pool
      .filter(p => !used.has(p.id))
      .sort(() => Math.random() - 0.5);
    picked.push(...remainder.slice(0, count - picked.length));
  }

  return picked.slice(0, count);
}

// =======================================================
// MAIN COMPONENT
// =======================================================
export default function PersonaSelection() {
  const { gameId } = useGame();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW STATE: Tracks the selected persona currently being hovered
  const [hoveredPersona, setHoveredPersona] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  const previousPayload = location.state || {}; // All previous data from Quiz Builder

  useEffect(() => {
    const fetchAllPersonas = async () => {
      try {
        const res = await fetch("http://localhost:3000/persona/all");
        if (!res.ok) throw new Error("Failed to fetch personas");
        const data = await res.json();
        setCatalog(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching personas:", err);
        setError("Unable to load personas.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllPersonas();
  }, []);

  // Map into UI model
  const PERSONAS = useMemo(() => mapPersonas(catalog || []), [catalog]);

  // UI state
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [limitBlink, setLimitBlink] = useState(false);
  const canAdd = selected.length < MAX_SELECTED;
  const [saveError, setSaveError] = useState("");

  const handleShuffle = () => {
    const exclude = new Set(selected.map(p => p.id));
    const batch = sampleUniqueByRole(PERSONAS, exclude, MAX_SELECTED);
    setAvailable(batch);
  };

  // spawn first batch when PERSONAS are loaded
  useEffect(() => {
    if (PERSONAS.length > 0) handleShuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PERSONAS]);

  const startDrag = (e, id) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const blinkLimit = () => {
    setLimitBlink(true);
    window.setTimeout(() => setLimitBlink(false), 500);
  };

  const addById = (id) => {
    const idStr = String(id);
    if (!canAdd) return blinkLimit();
    const p = available.find(x => String(x.id) === idStr);
    if (!p) return;
    setAvailable(prev => prev.filter(x => String(x.id) !== idStr));
    setSelected(prev => [...prev, p]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData("text/plain");
    addById(id);
  };

  const removeFromSelected = (id) => {
    const idStr = String(id);
    const p = selected.find(x => String(x.id) === idStr);
    if (!p) return;
    setSelected(prev => prev.filter(x => String(x.id) !== idStr));
    setAvailable(prev => [...prev, p]);
    // Clear hover state if the removed card was the one being hovered
    if (hoveredPersona && String(hoveredPersona.id) === idStr) {
      setHoveredPersona(null);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
     setSaveError("⚠️ Please select at least one persona before continuing.");
     return;
    }
    setSaveError(""); // clear any previous message if successful

    const personaIds = selected.map(p => p.id);
    const payload = {
      ...previousPayload,
      personas: personaIds,
    };

    console.log("Submitting payload:", payload);
    navigate("/quiz-builder", { state: payload });
  };

  if (loading) return <div className="loading">Loading personas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <section className="builder-persona">
      <div className="persona-header">
        <div>
          <h1 className="page-title">Persona Selection</h1>
          <div className="muted">Drag a card to the selections below. Max {MAX_SELECTED}.</div>
        </div>
        <button type="button" className="persona-shuffle-btn" onClick={handleShuffle} aria-label="Shuffle personas">
          <span className="persona-plus">+</span> Shuffle
        </button>
      </div>

      {/* Top tray (POOL) – full PersonaCard; click OR drag to add */}
      <div className="persona-tray">
        <div className="persona-deck" role="list" aria-label="Available personas">
          {available.map(p => (
            <button
              key={p.id}
              type="button"
              className="persona-card"
              draggable
              onDragStart={(e) => startDrag(e, p.id)}
              onClick={() => addById(p.id)}
              title={`${p.name} • ${p.role}`}
              aria-label={`Add ${p.name}`}
            >
              <PersonaCard {...p} />
            </button>
          ))}
          {available.length === 0 && (
            <div className="persona-empty-hint">All personas moved below.</div>
          )}
        </div>
      </div>

      {/* Bottom selections – avatar only */}
      <div className="persona-sel-head">
        <h2 className="persona-subtitle">Your Selections</h2>
        <span className="persona-count">{selected.length}/{MAX_SELECTED}</span>
      </div>
      
      <div
        className={`persona-selection ${dragOver ? "persona-drop-over" : ""} ${limitBlink ? "persona-limit-blink" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="region"
        aria-label="Drop selected personas here"
      >
        {selected.length === 0 ? (
          <div className="persona-selection-empty">No persona selected yet. Drag a card here.</div>
        ) : (
          <div className="persona-selection-grid" role="list">
            {selected.map(p => (
              <div
                key={p.id}
                className="persona-card-small"
                role="listitem"
                title={`${p.name} • ${p.role}`}
                // NEW: Hover handlers to set and clear the hovered persona
                onMouseEnter={() => setHoveredPersona(p)}
                onMouseLeave={() => setHoveredPersona(null)}
              >
                <SelectedCard avatar={p.avatar} small/> {/* avatar only */}
                <button
                  type="button"
                  className="persona-remove-btn"
                  onClick={() => removeFromSelected(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Persona Details Block - Renders when a card is hovered */}
      {hoveredPersona && <PersonaDetailsBlock persona={hoveredPersona} />}

      <div className="actions" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
        >
          Save & Continue
        </button>

        {saveError && (
          <div
            className="persona-save-error"
            role="alert"
            style={{
              color: "red",
              fontWeight: 500,
              marginTop: "0.5rem",
              textAlign: "center"
            }}
          >
            {saveError}
          </div>
        )}
      </div>
    </section>
  );
}

// =======================================================
// HELPER COMPONENTS
// =======================================================

// Component for the small avatar in the selection grid
function SelectedCard({ avatar, small = false }) {
  return (
    <div className={small ? "persona-face-small" : "persona-face"}>
      {avatar ? (
        <img className="persona-avatar" src={avatar} alt="" />
      ) : (
        <svg className="persona-icon" viewBox="0 0 24 24" aria-hidden>
          <circle cx="8" cy="9" r="3" />
          <circle cx="16.5" cy="10" r="2.5" />
          <circle cx="14.5" cy="6.5" r="2" />
          <rect x="4.5" y="13" width="9" height="6" rx="3" />
          <rect x="14" y="13" width="7" height="5" rx="2.5" />
        </svg>
      )}
    </div>
  );
}

// NEW COMPONENT: Display the detailed information for the hovered persona
function PersonaDetailsBlock({ persona }) {
  if (!persona) return null;

  return (
    <div className="persona-details-block">
      <h3 className="details-name">{persona.name}</h3>
      <div className="details-role">{persona.role}</div>
      <div className="details-info-grid">
        <div className="info-item">
          <div className="info-label">Profile</div>
          <div className="info-value">{persona.profile}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Traits</div>
          <div className="info-value">{persona.traits}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Motivation</div>
          <div className="info-value">{persona.motivation}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Attitude</div>
          <div className="info-value">{persona.attitude}</div>
        </div>
      </div>
    </div>
  );
}
