# VRM Teacher MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an optional VRM teacher in the existing left teacher panel, driven by the current real LLM + Volcano/Doubao TTS audio.

**Architecture:** Keep `VoiceTutor` responsible for TTS and audio playback. Add `AvatarTutor` as an optional renderer that loads `assets/teacher.vrm`, listens to audio playback, and opens the mouth from Web Audio amplitude; if the model or VRM libraries fail, the existing video teacher remains visible.

**Tech Stack:** Static HTML/CSS/JavaScript, Three.js, `@pixiv/three-vrm`, Web Audio API, Node test runner.

---

## Files

- `tests/voice-tutor-avatar-hooks.test.mjs`: verifies audio lifecycle hooks.
- `js/voice-tutor.js`: notifies `AvatarTutor` when audio starts/stops.
- `js/avatar-tutor.js`: optional VRM loader/renderer with audio-driven mouth movement.
- `app.html`: adds avatar stage and loads `avatar-tutor.js`.
- `css/main.css`: layers avatar stage over the existing teacher video only when ready.

## Task 1: Add TDD Coverage for Audio Hooks

- [ ] Create `tests/voice-tutor-avatar-hooks.test.mjs`.
- [ ] Run `node --test tests/voice-tutor-avatar-hooks.test.mjs` and confirm it fails because hooks are missing.
- [ ] Add `window.AvatarTutor?.attachAudio?.(audio)` and `window.AvatarTutor?.detachAudio?.()` calls in `js/voice-tutor.js`.
- [ ] Run `node --test tests/voice-tutor-avatar-hooks.test.mjs` and `node --test tests/local-server.test.mjs`.

## Task 2: Add Optional Avatar Stage

- [ ] Add `#teacher-avatar-stage` and `#teacher-avatar-canvas` inside `#teacher-section` while keeping the current `<video>`.
- [ ] Add CSS that hides the video only when `#teacher-section` has `teacher-avatar-ready`.
- [ ] Load `js/avatar-tutor.js` as a module after `js/voice-tutor.js`.

## Task 3: Implement AvatarTutor MVP

- [ ] Load Three.js, GLTFLoader, and `@pixiv/three-vrm` from CDN module URLs.
- [ ] Load `window.TEACHER_VRM_URL || 'assets/teacher.vrm'`.
- [ ] On success, render the VRM and add `teacher-avatar-ready`.
- [ ] On failure, log a warning and keep the video fallback visible.
- [ ] In `attachAudio(audio)`, use Web Audio API `AnalyserNode` to derive amplitude.
- [ ] During animation, map amplitude to common VRM mouth expressions such as `aa`, `A`, or `mouthOpen` when available.
- [ ] Add idle blink/head/breath movement when no audio is playing.

## Task 4: Verification

- [ ] Run `node --check js/avatar-tutor.js`.
- [ ] Run `node --check js/voice-tutor.js`.
- [ ] Run `node --test tests/voice-tutor-avatar-hooks.test.mjs`.
- [ ] Run `node --test tests/local-server.test.mjs`.
- [ ] Manual check: put a licensed model at `assets/teacher.vrm`, run `python serve.py`, open `http://localhost:8000/app.html`, enable voice teacher, ask a question, and confirm the VRM mouth moves during TTS.
