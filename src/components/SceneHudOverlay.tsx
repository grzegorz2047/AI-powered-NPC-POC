import { useWorldStore } from '../state/worldStore';
import './sceneHudOverlay.css';

const HUD_BY_MAP = {
  'roosevelt-lobby': {
    floor: 'Floor 1',
    room: 'Main Lobby',
    roomDetail: 'Roosevelt Hotel',
    shortcuts: ['Elevator', 'Reception', 'Palm room'],
  },
  'roosevelt-floor-3': {
    floor: 'Floor 3',
    room: 'Room 307',
    roomDetail: 'Deluxe King',
    shortcuts: ['Elevator', 'Stairs', 'Service room'],
  },
  'roosevelt-basement': {
    floor: 'B1',
    room: 'Service Level',
    roomDetail: 'Laundry & utility',
    shortcuts: ['Elevator', 'Laundry', 'Incinerator'],
  },
} as const;

const ACTIONS = [
  { label: 'Inspect', icon: '⌕' },
  { label: 'Talk', icon: '◌' },
  { label: 'Pick up', icon: '⌁' },
  { label: 'Open', icon: '▯' },
  { label: 'Use', icon: '⚙' },
  { label: 'Notebook', icon: '▤' },
] as const;

export function SceneHudOverlay() {
  const currentMapId = useWorldStore((state) => state.currentMapId);
  if (currentMapId === 'prototype-room-307') return null;

  const hud = HUD_BY_MAP[currentMapId];

  return (
    <div className="scene-hud-overlay" aria-hidden="true">
      <section className="floor-map-card">
        <div className="floor-map-title">
          <span>{hud.floor}</span>
          <b>◆</b>
        </div>
        <div className="floor-mini-map">
          <span className="mini-room mini-room-a" />
          <span className="mini-room mini-room-b" />
          <span className="mini-room mini-room-c" />
          <span className="mini-room mini-room-d" />
          <span className="mini-player-dot" />
          <span className="mini-north">N</span>
        </div>
        <div className="floor-map-location">
          <strong>{hud.room}</strong>
          <span>{hud.roomDetail}</span>
        </div>
        <div className="floor-map-shortcuts">
          <small>Shortcuts:</small>
          {hud.shortcuts.map((shortcut) => <span key={shortcut}>{shortcut}</span>)}
        </div>
      </section>

      <div className="scene-action-strip">
        {ACTIONS.map((action) => (
          <span className="scene-action" key={action.label}>
            <b>{action.icon}</b>
            <em>{action.label}</em>
          </span>
        ))}
      </div>
    </div>
  );
}
