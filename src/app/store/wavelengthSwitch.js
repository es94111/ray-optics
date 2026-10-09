/*
 * Copyright 2026 The Ray Optics Simulation authors and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { reactive, computed } from 'vue'
import { app } from '../services/app.js'
import { sceneObjs } from '../../core/index.js'
import Simulator from '../../core/Simulator.js'

/**
 * The preset list of wavelengths (in nm), in the order that the "next" action cycles through.
 */
export const WAVELENGTH_PRESETS = [450, 488, 515, 520, 532, 633, 635, 637, 638, 642, 658, 670, 685, 700]

// Only these scene object types represent light sources with an emission wavelength. Some other
// objects (e.g. Mirror, Blocker) also have a `wavelength` property, but it is used there for
// their dichroic/bandpass filter feature instead, so they must not be touched by this feature.
const LIGHT_SOURCE_TYPES = [
  sceneObjs.PointSource.type,
  sceneObjs.Beam.type,
  sceneObjs.SingleRay.type,
  sceneObjs.AngleSource.type
]

const MIN_WAVELENGTH = Simulator.UV_WAVELENGTH
const MAX_WAVELENGTH = Simulator.INFRARED_WAVELENGTH
const MIN_INTERVAL = 0.1
const MAX_INTERVAL = 60

const STORAGE_PREFIX = 'rayOpticsWavelengthSwitch'

const loadBool = (key, defaultValue) => {
  const stored = localStorage.getItem(STORAGE_PREFIX + key)
  if (stored === null) return defaultValue
  return stored === 'on'
}

const saveBool = (key, value) => {
  localStorage.setItem(STORAGE_PREFIX + key, value ? 'on' : 'off')
}

const loadNumber = (key, defaultValue) => {
  const stored = localStorage.getItem(STORAGE_PREFIX + key)
  if (stored === null) return defaultValue
  const parsed = Number(stored)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

const saveNumber = (key, value) => {
  localStorage.setItem(STORAGE_PREFIX + key, String(value))
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Recursively collect light source objects, including those nested inside module instances.
const collectLightSources = (objs, result = []) => {
  if (!Array.isArray(objs)) return result
  for (const obj of objs) {
    if (!obj) continue
    if (obj.constructor.type === 'ModuleObj') {
      collectLightSources(obj.objs, result)
    } else if (LIGHT_SOURCE_TYPES.includes(obj.constructor.type)) {
      result.push(obj)
    }
  }
  return result
}

// Create a single instance of the store
let storeInstance = null

// A single timer shared by all usages of the store (the Settings panel is mounted twice, once
// for the desktop layout and once for the mobile layout, so the timer must not live inside the
// Vue component or it would advance the wavelength twice per tick).
let timerHandle = null

/**
 * Create a Vue store for the "Wavelength Switching" feature, which lets the user cycle the
 * wavelength of all light sources in the scene among a preset list (or any custom value),
 * either manually (via `next()`) or automatically on a timer. This is an app-level (not
 * scene-level) feature: whether it is enabled, whether auto-switching is on, and the interval
 * are persisted to `localStorage` like other preferences, while the wavelength itself is applied
 * directly to the light source objects in the scene (and so is saved as part of the scene).
 *
 * @returns {Object} A Vue store for the wavelength switching feature.
 */
export const useWavelengthSwitchStore = () => {
  if (storeInstance) return storeInstance

  const state = reactive({
    enabled: loadBool('Enabled', false),
    auto: loadBool('Auto', false),
    interval: clamp(loadNumber('Interval', 1), MIN_INTERVAL, MAX_INTERVAL),
    current: clamp(loadNumber('Current', WAVELENGTH_PRESETS[0]), MIN_WAVELENGTH, MAX_WAVELENGTH)
  })

  // Apply `value` to every light source in the scene, then refresh the simulation, the object
  // bar (if a light source is currently selected), and the undo history.
  const applyToScene = (value) => {
    if (!app.scene) return
    const lightSources = collectLightSources(app.scene.objs)
    let changed = false
    for (const obj of lightSources) {
      if (obj.wavelength !== value) {
        obj.wavelength = value
        changed = true
      }
    }
    if (!changed) return

    const selectedIndex = app.editor?.selectedObjIndex
    if (selectedIndex >= 0 && LIGHT_SOURCE_TYPES.includes(app.scene.objs[selectedIndex]?.constructor.type)) {
      // Refresh the object bar so a displayed "wavelength" field (if any) stays in sync.
      app.editor.selectObj(selectedIndex)
    }
    app.simulator?.updateSimulation(false, true)
    app.editor?.onActionComplete()
  }

  const stopTimer = () => {
    if (timerHandle) {
      clearInterval(timerHandle)
      timerHandle = null
    }
  }

  const setCurrent = (value) => {
    const clamped = clamp(Math.round(value), MIN_WAVELENGTH, MAX_WAVELENGTH)
    state.current = clamped
    saveNumber('Current', clamped)
    if (state.enabled) {
      applyToScene(clamped)
    }
  }

  // Advance to the wavelength following the current one in the preset list (wrapping around).
  // If the current value is not in the preset list (e.g. a custom value was entered), start
  // from the first preset.
  const advance = () => {
    const idx = WAVELENGTH_PRESETS.indexOf(state.current)
    const nextValue = WAVELENGTH_PRESETS[idx === -1 ? 0 : (idx + 1) % WAVELENGTH_PRESETS.length]
    setCurrent(nextValue)
  }

  const updateTimer = () => {
    stopTimer()
    if (state.enabled && state.auto) {
      timerHandle = setInterval(advance, state.interval * 1000)
    }
  }

  const setEnabled = (value) => {
    state.enabled = value
    saveBool('Enabled', value)
    if (value) {
      // The wavelength only has a visual/physical effect when "Simulate Colors" is on, so turn
      // it on automatically to guarantee that switching wavelengths actually does something.
      if (app.scene && !app.scene.simulateColors) {
        app.scene.simulateColors = true
        document.dispatchEvent(new Event('sceneChanged'))
      }
      applyToScene(state.current)
    }
    updateTimer()
  }

  const setAuto = (value) => {
    state.auto = value
    saveBool('Auto', value)
    updateTimer()
  }

  const setIntervalSeconds = (value) => {
    const clamped = clamp(value, MIN_INTERVAL, MAX_INTERVAL)
    state.interval = clamped
    saveNumber('Interval', clamped)
    updateTimer()
  }

  // Resume auto-switching on load if it was left enabled in a previous session.
  updateTimer()

  storeInstance = {
    enabled: computed({ get: () => state.enabled, set: setEnabled }),
    auto: computed({ get: () => state.auto, set: setAuto }),
    interval: computed({ get: () => state.interval, set: setIntervalSeconds }),
    current: computed({ get: () => state.current, set: setCurrent }),
    next: advance,
    minWavelength: MIN_WAVELENGTH,
    maxWavelength: MAX_WAVELENGTH,
    minInterval: MIN_INTERVAL,
    maxInterval: MAX_INTERVAL
  }

  return storeInstance
}
