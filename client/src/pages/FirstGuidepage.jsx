import { useState, useEffect, useRef } from 'react';

// ─── SVG Icons (no emoji dependency) ─────────────────────────────────────────
const Icons = {
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  Brain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
      <path d="M9.5 2C7 2 5 4 5 6.5c0 .5.1 1 .25 1.45C3.9 8.7 3 10.2 3 12c0 2.5 1.7 4.6 4 5.2V19a1 1 0 001 1h8a1 1 0 001-1v-1.8c2.3-.6 4-2.7 4-5.2 0-1.8-.9-3.3-2.25-4.05C18.9 7.5 19 7 19 6.5 19 4 17 2 14.5 2c-1.1 0-2.1.4-2.8 1.1A3.47 3.47 0 009.5 2z"/>
    </svg>
  ),
  Skull: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 2.68 1.32 5.05 3.35 6.51L7 18h2v2h2v-2h2v2h2v-2h2l-.35-1.49C20.68 15.05 22 12.68 22 10c0-4.42-3.58-8-10-8zm-2 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
    </svg>
  ),
  Bone: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M17.5 3A2.5 2.5 0 0015 5.5c0 .47.13.9.35 1.28L5.78 16.35A2.49 2.49 0 005.5 16 2.5 2.5 0 003 18.5 2.5 2.5 0 005.5 21 2.5 2.5 0 008 18.5c0-.47-.13-.9-.35-1.28l9.57-9.57c.38.22.81.35 1.28.35A2.5 2.5 0 0021 5.5 2.5 2.5 0 0018.5 3a2.5 2.5 0 00-1 0zm-13 13A2.5 2.5 0 013 18.5 2.5 2.5 0 015.5 21 2.5 2.5 0 008 18.5 2.5 2.5 0 005.5 16zm12-13A2.5 2.5 0 0120 5.5 2.5 2.5 0 0117.5 8 2.5 2.5 0 0115 5.5 2.5 2.5 0 0117.5 3z"/>
    </svg>
  ),
  Drop: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z"/>
    </svg>
  ),
  Snake: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
      <path d="M3 8c0-2.2 1.8-4 4-4h0a4 4 0 014 4v0a4 4 0 004 4h0a4 4 0 014 4v0a4 4 0 01-4 4"/>
      <circle cx="7" cy="8" r="1" fill="currentColor"/>
      <path d="M5.5 6.5l-1-1M8.5 6.5l1-1" strokeLinecap="round"/>
    </svg>
  ),
  Throat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 9c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3v3" strokeLinecap="round"/>
      <circle cx="12" cy="18" r="0.8" fill="currentColor"/>
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
    </svg>
  ),
  Arrow: ({ dir = 'right' }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : 'none' }}>
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
  Ambulance: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
      <path d="M18 18.5a1.5 1.5 0 01-1.5 1.5A1.5 1.5 0 0115 18.5a1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5m-9 0A1.5 1.5 0 018 20a1.5 1.5 0 01-1.5-1.5A1.5 1.5 0 018 17a1.5 1.5 0 011.5 1.5M17 5v3h-2V5h-2v3H9.88C8.83 8 8 8.83 8 9.88V12H6v2h2v2H6v2h2.5c.46-1.76 2.08-3 3.97-3s3.5 1.24 3.97 3H19V9l-2-4zm-2 5h-4V9.5c0-.28.22-.5.5-.5H15v1zm2 0h-1V9h1v1z"/>
      <path d="M11 10h1v-1h1v1h1v1h-1v1h-1v-1h-1z"/>
    </svg>
  ),
};

// ─── Step Icons Map ───────────────────────────────────────────────────────────
const StepIconMap = {
  '📞': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  ),
  '🛋️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M21 9V7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v5h1.33L3 18h1l.67-2h12.67l.66 2h1l.67-2H21v-5c0-1.1-.9-2-2-2zM5 7h14v2h-4v2H9V9H5V7zm-2 8v-3h16v3H3z"/>
    </svg>
  ),
  '💊': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M4.22 11.29l6.07-6.07a5.01 5.01 0 017.07 0 5.01 5.01 0 010 7.07l-6.07 6.07a5.01 5.01 0 01-7.07 0 5.01 5.01 0 010-7.07zm1.88 5.19a2.99 2.99 0 004.24 0L13 13.83l-4.24-4.24-2.66 2.65a2.99 2.99 0 000 4.24zm5.66-9.9l-2.65 2.65 4.24 4.24 2.65-2.65a2.99 2.99 0 000-4.24 2.99 2.99 0 00-4.24 0z"/>
    </svg>
  ),
  '😮‍💨': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8 13v-2h8v2H8zm4-7c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm-3 9l1.5 2h3l1.5-2H9z"/>
    </svg>
  ),
  '🤲': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M13 9V3.5C13 2.67 13.67 2 14.5 2S16 2.67 16 3.5V9h-3zm8.5 11H13v-5l-2.83-2.83c-.38-.38-.38-1.02 0-1.41.38-.38 1.02-.38 1.41 0L13 12.17V9h3v.5l1.5 1.5V9h1V7c0-.55.45-1 1-1s1 .45 1 1v9c0 2.21-1.79 4-4 4h-5c-.55 0-1-.45-1-1s.45-1 1-1H11l-4-4.72V8c0-.55.45-1 1-1s1 .45 1 1v4.5l1 1V8.5c0-.55.45-1 1-1s1 .45 1 1V11h1V8.5c0-.55.45-1 1-1s1 .45 1 1V9z"/>
    </svg>
  ),
  '💨': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M9.64 7.64C9.88 7.26 10 6.86 10 6.5 10 5.12 8.88 4 7.5 4S5 5.12 5 6.5h2c0-.28.22-.5.5-.5s.5.22.5.5-.32.67-.56 1.02C6.7 8.44 6 9.42 6 11h2c0-1.14.47-1.65 1.64-3.36zM6 20h14v-2H6v2zm0-4h10v-2H6v2zm0-4h14v-2H6v2z"/>
    </svg>
  ),
  '🏥': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
    </svg>
  ),
  '🔊': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  ),
  '🔍': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  '🚫': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/>
    </svg>
  ),
  '👁️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  '🚿': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M9.64 3.64L8.22 2.22 6.81 3.64 8.22 5.05 9.64 3.64zm3.54 0L11.76 2.22l-1.41 1.42 1.41 1.41 1.42-1.41zm3.54 0L15.3 2.22l-1.41 1.42 1.41 1.41 1.42-1.41zM7 6.05L5.59 4.64 4.17 6.05l1.42 1.42L7 6.05zm3.54 0L9.12 4.64 7.71 6.05l1.41 1.42 1.42-1.42zm3.54 0l-1.42-1.41-1.41 1.41 1.41 1.42 1.42-1.42zM4.17 8.5L2.76 9.91l1.41 1.42 1.42-1.42L4.17 8.5zm3.54 0l-1.42 1.41 1.42 1.42 1.41-1.42L7.71 8.5zM14.5 8h-5C8.12 8 7 9.12 7 10.5V20h2v-4.5h6V20h2v-9.5c0-1.38-1.12-2.5-2.5-2.5zm.5 5H9v-2.5c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5V13z"/>
    </svg>
  ),
  '✂️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M9.64 7.64C9.88 7.26 10 6.86 10 6.5 10 5.12 8.88 4 7.5 4S5 5.12 5 6.5s1.12 2.5 2.5 2.5c.37 0 .74-.09 1.07-.24L10 10l-1.43 1.43c-.33-.15-.7-.23-1.07-.23C6.12 11.2 5 12.32 5 13.7s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5c0-.37-.09-.74-.24-1.07L11 11.19l6.5 6.5H20v-.5L9.64 7.64zM7.5 9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm0 6c-.83 0-1.5-.67-1.5-1.5S6.67 12 7.5 12s1.5.67 1.5 1.5S8.33 15 7.5 15zM11 10l1.41 1.41-1.41 1.42L9.59 11.41 11 10zm3-5h1.5L20 9.5 18.5 11 14 5z"/>
    </svg>
  ),
  '🩹': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M17.73 12.02l3.98-3.98a.996.996 0 000-1.41l-4.34-4.34a.996.996 0 00-1.41 0l-3.98 3.98L6 2.29C5.8 2.1 5.55 2 5.29 2c-.25 0-.51.1-.7.29L.29 6.59a.996.996 0 000 1.41l3.98 3.98L.29 15.96a.996.996 0 000 1.41l4.34 4.34c.39.39 1.02.39 1.41 0l3.98-3.98 3.98 3.98c.2.2.45.29.71.29.26 0 .51-.1.71-.29l4.29-4.29c.39-.39.39-1.02 0-1.41l-3.98-3.99zm-2.1-1.7c.39.39.39 1.02 0 1.41L14 13.36l-3.36-3.36 1.63-1.63c.39-.39 1.02-.39 1.41 0l1.95 1.95zm-10-3.59l2.62-2.62 11.91 11.91-2.62 2.62L5.63 6.73zm11.69 8.23l-1.62 1.63-3.37-3.37 1.63-1.63 3.36 3.37z"/>
    </svg>
  ),
  '💊': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M4.22 11.29l6.07-6.07a5.01 5.01 0 017.07 7.07l-6.07 6.07a5.01 5.01 0 01-7.07-7.07zm7.07 4.95l2.83-2.83-4.24-4.24-2.83 2.83 4.24 4.24z"/>
    </svg>
  ),
  '🛑': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
    </svg>
  ),
  '🧊': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M22 11h-4.17l2.24-2.24-1.41-1.41L15 11h-2V9l3.66-3.66-1.42-1.42L13 6.17V2h-2v4.17l-2.24-2.25-1.42 1.42L11 9v2H9L5.34 7.35 3.93 8.76 6.17 11H2v2h4.17l-2.24 2.24 1.41 1.41L9 13h2v2l-3.66 3.66 1.42 1.42L11 17.83V22h2v-4.17l2.24 2.24 1.42-1.41L13 15v-2h2l3.66 3.65 1.41-1.42L17.83 13H22v-2zm-10 3c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  ),
  '🪵': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  ),
  '💜': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  '🧤': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M19 4h-1c0-1.1-.9-2-2-2s-2 .9-2 2H9.83C9.4 2.84 8.3 2 7 2 5.34 2 4 3.34 4 5v11c0 3.31 2.69 6 6 6h4c3.31 0 6-2.69 6-6V7c0-1.66-1.34-3-3-3zm1 12c0 2.21-1.79 4-4 4h-4c-2.21 0-4-1.79-4-4V5c0-.55.45-1 1-1s1 .45 1 1v7h2V4h1v8h2V4h1c.55 0 1 .45 1 1v15h2V7c0-.55.45-1 1-1s1 .45 1 1v9z"/>
    </svg>
  ),
  '⬆️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
    </svg>
  ),
  '🏃': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
    </svg>
  ),
  '↩️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z"/>
    </svg>
  ),
  '🌡️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-3 7c-1.65 0-3-1.35-3-3 0-1.3.84-2.4 2-2.82V5c0-.55.45-1 1-1s1 .45 1 1v9.18c1.16.41 2 1.51 2 2.82 0 1.65-1.35 3-3 3z"/>
    </svg>
  ),
  '🫁': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  ),
  '👊': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0019.99 4H7.21L6.54 2.57A1 1 0 005.63 2H2v2h2.22l3.24 6.83L6.25 13c-.16.28-.25.61-.25.95C6 15.1 6.9 16 8 16h12v-2H8.42c-.13 0-.25-.11-.25-.24l.03-.14.9-1.62z"/>
    </svg>
  ),
  '🫃': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z"/>
    </svg>
  ),
  '🔄': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
    </svg>
  ),
  '👶': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M9 13.75c-.63 0-1.25.63-1.25 1.25s.62 1.25 1.25 1.25 1.25-.63 1.25-1.25S9.63 13.75 9 13.75zm6 0c-.63 0-1.25.63-1.25 1.25s.62 1.25 1.25 1.25 1.25-.63 1.25-1.25-.62-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 13.05 10 15.42 10c1.52 0 2.86-.64 3.79-1.66.9 1.04 1.16 2.87.79 4.15-.06-.02-.12-.03-.18-.03-1.29 0-2.35 1.06-2.35 2.35v.08C17.22 17.42 16.41 20 12 20z"/>
    </svg>
  ),
  '⏱️': ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <path d="M15.07 1.01h-6v2h6v-2zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C17.07 4.74 15.12 4 13.07 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.05-.74-3.93-1.97-5.6zm-7.03 12.6c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
    </svg>
  ),
  default: ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} width="20" height="20">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
};

function StepSVGIcon({ emoji, color }) {
  const Comp = StepIconMap[emoji] || StepIconMap['default'];
  return <Comp color={color} />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'heart_attack',
    Icon: Icons.Heart,
    name: 'Heart Attack',
    severity: 'critical',
    callEmergency: true,
    tip: 'Give Aspirin (325mg) to chew — only if no allergy. Do not swallow whole.',
    steps: [
      { icon: '📞', title: 'Call 112 immediately', desc: 'Call an ambulance right away. State your location clearly. Stay on the call.', duration: null },
      { icon: '🛋️', title: 'Place patient in comfortable position', desc: 'Half-sitting (45°) or flat. Loosen tight clothing and belt. Do not move them unnecessarily.', duration: null },
      { icon: '💊', title: 'Give Aspirin (if available)', desc: 'Ask them to chew 325mg aspirin. Check for allergy first.', duration: null },
      { icon: '😮‍💨', title: 'Check breathing', desc: 'Watch chest movement for 10 seconds. If breathing stops — begin CPR.', duration: 10 },
      { icon: '🤲', title: 'CPR: 30 chest compressions', desc: 'Place both hands on center of chest. Press 5–6 cm deep at 100–120 per minute.', duration: 18 },
      { icon: '💨', title: 'CPR: 2 rescue breaths', desc: 'Pinch nose, seal mouth, give 2 breaths. Continue 30:2 cycle until ambulance arrives.', duration: null },
      { icon: '🏥', title: 'Inform the ambulance team', desc: "Give patient's age, medicines, allergies, and symptom onset time to the team.", duration: null },
    ],
  },
  {
    id: 'unconscious',
    Icon: Icons.Brain,
    name: 'Unconscious Person',
    severity: 'critical',
    callEmergency: true,
    tip: 'Do not give anything to eat or drink to an unconscious person — choking risk.',
    steps: [
      { icon: '🔊', title: 'Check for response', desc: 'Call their name, shake their shoulder. No response — call 112.', duration: null },
      { icon: '📞', title: 'Call 112', desc: 'State location, age, and symptoms clearly. Keep on speaker for guidance.', duration: null },
      { icon: '🫁', title: 'Check breathing', desc: 'Watch chest movement for 10 seconds. Feel for breath near the mouth.', duration: 10 },
      { icon: '↩️', title: 'Place in recovery position', desc: 'If breathing: lay on left side. Tilt head slightly back to open airway.', duration: null },
      { icon: '🤲', title: 'Not breathing — start CPR', desc: '30 chest compressions + 2 rescue breaths. Continue until help arrives.', duration: null },
      { icon: '🌡️', title: 'Keep warm, do not move', desc: 'Cover with a blanket. Risk of spine injury — do not move until professionals arrive.', duration: null },
    ],
  },
  {
    id: 'poisoning',
    Icon: Icons.Skull,
    name: 'Child Swallowed Something',
    severity: 'high',
    callEmergency: true,
    tip: 'Do NOT induce vomiting — chemicals can damage the throat on the way back up.',
    steps: [
      { icon: '🔍', title: 'Identify what was swallowed', desc: 'Find the container or packet. Note the item, quantity, and time. Remember the child\'s age and weight.', duration: null },
      { icon: '📞', title: 'Call Poison Helpline / 112', desc: 'India Poison Control: 1800-116-117 (toll free). State the exact item and quantity.', duration: null },
      { icon: '🚫', title: 'Do NOT induce vomiting', desc: 'Do not give anything to eat or drink unless a doctor instructs. Not even milk.', duration: null },
      { icon: '👁️', title: 'Observe symptoms', desc: 'Check breathing, skin color, and alertness. Seizure or unconsciousness — call 112 immediately.', duration: null },
      { icon: '🏥', title: 'Go to hospital — bring the container', desc: 'Take the container, packet, or pill strip along — doctors will need exact information.', duration: null },
    ],
  },
  {
    id: 'burns',
    Icon: Icons.Flame,
    name: 'Burns',
    severity: 'high',
    callEmergency: false,
    tip: 'Do NOT apply toothpaste, ghee, or any cream — it worsens infection.',
    steps: [
      { icon: '🚿', title: 'Run cool water for 20 minutes', desc: 'Use cool (not ice cold) water for 20 minutes. No ice, butter, or toothpaste.', duration: 1200 },
      { icon: '✂️', title: 'Gently remove clothing and jewelry', desc: 'Do not pull stuck clothing. Remove jewelry — swelling will make it impossible later.', duration: null },
      { icon: '🩹', title: 'Cover loosely', desc: 'Loosely cover with clean plastic wrap or clean cloth. Do not wrap tight — circulation may be blocked.', duration: null },
      { icon: '💊', title: 'Paracetamol for pain', desc: 'Paracetamol or ibuprofen can be given. Do not pop blisters — risk of infection.', duration: null },
      { icon: '🏥', title: 'When to see a doctor', desc: 'Burns on face, hands, or genitals, burns larger than 3cm, or deep burns — go to hospital immediately.', duration: null },
    ],
  },
  {
    id: 'fracture',
    Icon: Icons.Bone,
    name: 'Fracture / Broken Bone',
    severity: 'medium',
    callEmergency: false,
    tip: 'Do NOT try to straighten the bone — nerve or blood vessel damage can occur.',
    steps: [
      { icon: '🛑', title: 'Stop movement — immobilize', desc: 'Do not move the fractured part at all. Keep the patient stable.', duration: null },
      { icon: '🧊', title: 'Apply ice pack', desc: 'Wrap ice in cloth and apply. 20 min on, 20 min off. Reduces swelling and pain.', duration: 1200 },
      { icon: '🪵', title: 'Make a splint', desc: 'Support the injured part with a stick or cardboard. Tie loosely with cloth — not tight.', duration: null },
      { icon: '💜', title: 'Check circulation', desc: 'Check feeling in fingers or toes every 10 minutes. Numbness or blue color — loosen the splint.', duration: 600 },
      { icon: '🏥', title: 'Go to hospital — X-ray is necessary', desc: 'Open fracture (bone visible) — call 112 immediately. Otherwise, get to hospital quickly.', duration: null },
    ],
  },
  {
    id: 'bleeding',
    Icon: Icons.Drop,
    name: 'Severe Bleeding',
    severity: 'high',
    callEmergency: false,
    tip: 'If an object is lodged in the wound — do NOT remove it. Apply pressure around it.',
    steps: [
      { icon: '🧤', title: 'Protect yourself first', desc: 'Wear gloves or use a plastic bag. Do not directly touch someone else\'s blood.', duration: null },
      { icon: '🤲', title: 'Apply direct pressure for 10 minutes', desc: 'Press firmly on the wound with a clean cloth. At least 10 minutes. Do not lift to check.', duration: 600 },
      { icon: '⬆️', title: 'Elevate the injured part', desc: 'If on the arm or leg, raise it above the heart level — gravity reduces blood flow.', duration: null },
      { icon: '🩹', title: 'Bandage the wound', desc: 'If cloth soaks through, do not remove — add more on top. Do not bandage too tight.', duration: null },
      { icon: '📞', title: 'When to call 112', desc: 'Bleeding does not stop in 10 min, very large blood loss, or wound is very deep or wide.', duration: null },
    ],
  },
  {
    id: 'snakebite',
    Icon: Icons.Snake,
    name: 'Snake Bite',
    severity: 'critical',
    callEmergency: true,
    tip: 'Do not try to kill the snake — most accidents happen that way. No need to photograph it either.',
    steps: [
      { icon: '🏃', title: 'Move away from the snake', desc: 'Get the patient and everyone away from the snake. Minimize movement — it spreads venom faster.', duration: null },
      { icon: '📞', title: 'Call 112 immediately', desc: 'Anti-venom is only available at hospitals. Do not waste a single minute.', duration: null },
      { icon: '🛋️', title: 'Lay down — stay calm', desc: 'Keep the bitten area below heart level. Panic and movement spread venom faster.', duration: null },
      { icon: '✂️', title: 'Remove rings, watch, and jewelry', desc: 'Remove all jewelry near the bite area — swelling will make it impossible to remove later.', duration: null },
      { icon: '🚫', title: 'Do NOT do these things', desc: 'Do not suck venom. No tourniquet. No cuts. No ice. These are all wrong and harmful.', duration: null },
      { icon: '⏱️', title: 'Note the time', desc: 'Record the exact time of the bite and when symptoms appeared — doctors will need this information.', duration: null },
    ],
  },
  {
    id: 'choking',
    Icon: Icons.Throat,
    name: 'Choking',
    severity: 'critical',
    callEmergency: true,
    tip: 'If the person can cough or speak — let them clear it themselves. Do not intervene yet.',
    steps: [
      { icon: '🔊', title: 'Assess severity', desc: 'Can they speak? If yes — encourage strong coughing. If no — proceed to next step.', duration: null },
      { icon: '👊', title: 'Give 5 back blows', desc: 'Stand beside patient. Hold chest with one hand. Strike firmly between shoulder blades 5 times with the other.', duration: null },
      { icon: '🫃', title: '5 abdominal thrusts (Heimlich)', desc: 'Stand behind patient. Place fist above navel. Other hand over it. Thrust inward and upward 5 times.', duration: null },
      { icon: '🔄', title: 'Alternate and repeat', desc: '5 back blows + 5 abdominal thrusts — repeat this cycle until the object is dislodged or ambulance arrives.', duration: null },
      { icon: '👶', title: 'For infants (< 1 year)', desc: 'No abdominal thrusts. Lay face-down on forearm, give 5 back blows. Then 5 chest thrusts with 2 fingers.', duration: null },
    ],
  },
];

const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)' },
  high:     { label: 'HIGH',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.28)' },
  medium:   { label: 'MEDIUM',   color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.28)'  },
  low:      { label: 'LOW',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.28)'  },
};

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useTimer(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning]     = useState(false);
  const intervalRef               = useRef(null);

  useEffect(() => { setRemaining(seconds); setRunning(false); clearInterval(intervalRef.current); }, [seconds]);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => { if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; } return r - 1; });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = () => { if (remaining > 0) setRunning((r) => !r); };
  const reset  = () => { clearInterval(intervalRef.current); setRunning(false); setRemaining(seconds); };
  return { remaining, running, toggle, reset, done: remaining === 0 };
}

// ─── TimerBadge ───────────────────────────────────────────────────────────────
function TimerBadge({ seconds }) {
  const { remaining, running, toggle, reset, done } = useTimer(seconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct  = ((seconds - remaining) / seconds) * 100;

  return (
    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: done ? '#22c55e' : '#15b38a', borderRadius: 2, transition: 'width 1s linear' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: done ? '#4ade80' : '#e2e8f0', minWidth: 52, textAlign: 'right', fontFamily: 'monospace' }}>
          {done ? '✓ Done' : `${mins}:${String(secs).padStart(2, '0')}`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={toggle} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: done ? 'rgba(34,197,94,0.15)' : '#15b38a', color: done ? '#4ade80' : 'white', fontSize: 12, fontWeight: 700, cursor: done ? 'default' : 'pointer', letterSpacing: 0.3 }}>
          {done ? '✓ Completed' : running ? '⏸ Pause' : '▶ Start Timer'}
        </button>
        {!done && (
          <button onClick={reset} style={{ padding: '7px 12px', borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
            ↺
          </button>
        )}
      </div>
    </div>
  );
}

// ─── StepCard ─────────────────────────────────────────────────────────────────
function StepCard({ step, index, active, done, color }) {
  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        opacity: done ? 0.55 : active ? 1 : 0.3,
        transition: 'opacity 0.3s',
      }}
    >
      {/* Step number + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          background: done ? 'rgba(34,197,94,0.18)' : active ? color : 'rgba(255,255,255,0.06)',
          color:      done ? '#4ade80'               : active ? 'white' : '#64748b',
          border:     done ? '1.5px solid #4ade80'   : active ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
          boxShadow:  active && !done ? `0 0 12px ${color}44` : 'none',
          transition: 'all 0.3s',
        }}>
          {done ? <Icons.Check /> : <span style={{ fontSize: 11 }}>{index + 1}</span>}
        </div>
        <div style={{ width: 1.5, flex: 1, minHeight: 20, background: active ? `${color}55` : 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: active ? `1px solid ${color}35` : '1px solid rgba(255,255,255,0.06)',
        alignSelf: 'flex-start', color: active ? color : '#64748b', transition: 'all 0.3s',
      }}>
        <StepSVGIcon emoji={step.icon} color={active ? color : '#64748b'} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: active ? '#f1f5f9' : '#94a3b8', marginBottom: 4, letterSpacing: 0.1 }}>
          {step.title}
        </p>
        <p style={{ fontSize: 12, color: active ? '#cbd5e1' : '#475569', lineHeight: 1.65 }}>
          {step.desc}
        </p>
        {active && step.duration && <TimerBadge seconds={step.duration} />}
      </div>
    </div>
  );
}

// ─── ScenarioDetail ───────────────────────────────────────────────────────────
function ScenarioDetail({ scenario, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const sev = SEVERITY_CONFIG[scenario.severity];

  return (
    <div style={{ animation: 'slideUp 0.22s ease' }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${sev.color}18`, border: `1.5px solid ${sev.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sev.color, flexShrink: 0 }}>
          <scenario.Icon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '2px 8px', borderRadius: 4, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
              {sev.label}
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', letterSpacing: 0.1 }}>{scenario.name}</p>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.Close />
        </button>
      </div>

      {/* Emergency banner */}
      {scenario.callEmergency && (
        <div style={{ margin: '16px 20px 0', background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#fca5a5' }}><Icons.Phone /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#fca5a5', letterSpacing: 0.2 }}>EMERGENCY — Call 112 immediately</p>
            <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Perform these steps while waiting for the ambulance</p>
          </div>
          <a href="tel:112" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 800, textDecoration: 'none', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
            Call 112
          </a>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', fontWeight: 600 }}>
          Step {activeStep + 1} / {scenario.steps.length}
        </span>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((activeStep + 1) / scenario.steps.length) * 100}%`, background: sev.color, borderRadius: 2, transition: 'width 0.35s ease' }} />
        </div>
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
          {Math.round(((activeStep + 1) / scenario.steps.length) * 100)}%
        </span>
      </div>

      {/* Steps */}
      <div style={{ padding: '4px 20px 4px' }}>
        {scenario.steps.map((step, i) => (
          <div key={i} onClick={() => setActiveStep(i)} style={{ cursor: 'pointer' }}>
            <StepCard step={step} index={i} active={i === activeStep} done={i < activeStep} color={sev.color} />
          </div>
        ))}
      </div>

      {/* Tip */}
      <div style={{ margin: '0 20px 16px', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.18)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10 }}>
        <span style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }}><Icons.Warning /></span>
        <p style={{ fontSize: 12, color: '#fde047', lineHeight: 1.65 }}>
          <strong style={{ fontWeight: 700 }}>Important: </strong>{scenario.tip}
        </p>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
        <button
          onClick={() => setActiveStep((s) => Math.max(s - 1, 0))}
          disabled={activeStep === 0}
          style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icons.Arrow dir="left" /> Previous
        </button>
        <button
          onClick={() => setActiveStep((s) => Math.min(s + 1, scenario.steps.length - 1))}
          disabled={activeStep === scenario.steps.length - 1}
          style={{ flex: 2, padding: '11px 0', borderRadius: 9, border: 'none', background: activeStep === scenario.steps.length - 1 ? 'rgba(255,255,255,0.06)' : '#15b38a', color: activeStep === scenario.steps.length - 1 ? '#475569' : 'white', fontSize: 13, fontWeight: 700, cursor: activeStep === scenario.steps.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {activeStep === scenario.steps.length - 1 ? '✓ All Steps Done' : <>Next Step <Icons.Arrow /></>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FirstAidGuidePage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');

  const filtered = SCENARIOS.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Icons.Ambulance />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: 0.2 }}>First Aid Guide</h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Step-by-step emergency instructions — works offline</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(34,197,94,0.09)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 20, padding: '4px 13px', marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Works Offline — No internet needed</span>
        </div>
      </div>

      {/* Search */}
      {!selected && (
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}><Icons.Search /></span>
            <input
              type="text"
              placeholder="Search emergency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {selected ? (
        <div style={{ background: '#1e293b', margin: '0 24px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <ScenarioDetail scenario={selected} onClose={() => setSelected(null)} />
        </div>
      ) : (
        <div style={{ padding: '0 24px 32px' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))', gap: 12 }}>
            {filtered.map((s) => {
              const sev = SEVERITY_CONFIG[s.severity];
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setSearch(''); }}
                  style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 14px', cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', color: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = sev.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${sev.color}22`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: sev.color, boxShadow: `0 0 6px ${sev.color}` }} />
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${sev.color}15`, border: `1.5px solid ${sev.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: sev.color }}>
                    <s.Icon />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.4, display: 'block', letterSpacing: 0.1 }}>
                    {s.name}
                  </span>
                  {s.callEmergency && (
                    <span style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: sev.color, background: sev.bg, padding: '2px 8px', borderRadius: 4, fontWeight: 700, border: `1px solid ${sev.border}` }}>
                      <Icons.Phone /> 112
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#334155' }}>
              <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.4 }}>?</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>No scenario found</p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: 24, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65 }}>
              <strong style={{ color: '#a5b4fc' }}>⚕ Medical Disclaimer: </strong>
              This guide is for general first-aid information only. Always contact professional medical help first. This cannot replace a doctor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}