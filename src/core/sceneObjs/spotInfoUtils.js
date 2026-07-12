/*
 * Copyright 2025 The Ray Optics Simulation authors and contributors
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

import i18next from 'i18next';

/**
 * Shared "show spot info" feature for reflective surfaces (mirrors and the concave
 * diffraction grating): an opt-in overlay that reports, for the current simulation run,
 * the brightness-weighted average position of the points where rays hit the surface,
 * and the diagonal of the bounding box of those points (used as an approximation of the
 * spot's full width). This is intentionally shape-agnostic (it only looks at the incident
 * points, not at the object's own geometry), so the same functions can be reused by every
 * mirror-like object regardless of how its surface is parametrized (line, arc, Bezier
 * curve, parametric curve, etc.).
 */

/**
 * Get the `showSpotInfo` property schema entry, to be spread into `getPropertySchema`.
 * @returns {Array<Object>}
 */
export function getSpotInfoPropertySchema() {
  return [
    { key: 'showSpotInfo', type: 'boolean', label: i18next.t('simulator:sceneObjs.common.showSpotInfo') },
  ];
}

/**
 * Create the "show spot info" checkbox in the object bar.
 * @param {Object} obj - The scene object instance.
 * @param {ObjBar} objBar - The object bar.
 */
export function populateSpotInfoObjBar(obj, objBar) {
  objBar.createBoolean(i18next.t('simulator:sceneObjs.common.showSpotInfo'), obj.showSpotInfo, function (obj, value) {
    obj.showSpotInfo = value;
  }, i18next.t('simulator:sceneObjs.common.showSpotInfoInfo'));
}

/**
 * Reset the accumulated spot statistics. Should be called from `onSimulationStart`.
 * @param {Object} obj - The scene object instance.
 */
export function resetSpotInfo(obj) {
  obj.spotHitCount = 0;
  obj.spotSumX = 0;
  obj.spotSumY = 0;
  obj.spotSumWeight = 0;
  obj.spotMinX = Infinity;
  obj.spotMaxX = -Infinity;
  obj.spotMinY = Infinity;
  obj.spotMaxY = -Infinity;
}

/**
 * Record a ray hit for the spot statistics. Should be called from `onRayIncident`, with
 * `weight` being the ray's brightness (e.g. `ray.brightness_s + ray.brightness_p`).
 * Does nothing if `showSpotInfo` is off, to avoid the bookkeeping cost when not needed.
 * @param {Object} obj - The scene object instance.
 * @param {Point} incidentPoint - The point where the ray hit the surface.
 * @param {number} weight - The brightness of the incident ray.
 */
export function recordSpotInfoHit(obj, incidentPoint, weight) {
  if (!obj.showSpotInfo) return;

  obj.spotHitCount++;

  const w = weight > 0 ? weight : 0;
  obj.spotSumX += incidentPoint.x * w;
  obj.spotSumY += incidentPoint.y * w;
  obj.spotSumWeight += w;

  if (incidentPoint.x < obj.spotMinX) obj.spotMinX = incidentPoint.x;
  if (incidentPoint.x > obj.spotMaxX) obj.spotMaxX = incidentPoint.x;
  if (incidentPoint.y < obj.spotMinY) obj.spotMinY = incidentPoint.y;
  if (incidentPoint.y > obj.spotMaxY) obj.spotMaxY = incidentPoint.y;
}

/**
 * Draw the spot info text overlay (position and size), if enabled and data is available.
 * Should be called at the end of `draw`, unconditionally (it checks `isAboveLight` itself
 * so that it is only drawn once, in the same layer as the Detector's readout).
 * @param {Object} obj - The scene object instance.
 * @param {CanvasRenderer} canvasRenderer - The canvas renderer.
 * @param {boolean} isAboveLight - Whether the rendering layer is above the light layer.
 * @param {boolean} isHovered - Whether the object is hovered by the mouse.
 */
export function drawSpotInfo(obj, canvasRenderer, isAboveLight, isHovered) {
  if (!obj.showSpotInfo || !isAboveLight) return;
  if (!(obj.spotHitCount > 0)) return;

  const ctx = canvasRenderer.ctx;
  const ls = canvasRenderer.lengthScale;

  const size = Math.hypot(obj.spotMaxX - obj.spotMinX, obj.spotMaxY - obj.spotMinY);
  const cx = obj.spotSumWeight > 0 ? obj.spotSumX / obj.spotSumWeight : (obj.spotMinX + obj.spotMaxX) / 2;
  const cy = obj.spotSumWeight > 0 ? obj.spotSumY / obj.spotSumWeight : (obj.spotMinY + obj.spotMaxY) / 2;

  if (!obj.scene.simulator?.isLightLayerSynced) {
    // If the light layer is not synced, gray out the readings to indicate that they are not up to date.
    ctx.globalAlpha = 0.5;
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.font = (obj.scene.theme.detectorText.size * ls) + 'px ' + obj.scene.theme.detectorText.font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = isHovered ? obj.scene.highlightColorCss : canvasRenderer.rgbaToCssColor(obj.scene.theme.detectorText.color);
  ctx.fillText('Pos=(' + cx.toFixed(2) + ', ' + cy.toFixed(2) + ')', cx + 5 * ls, cy + 5 * ls);
  ctx.fillText('Size=' + size.toFixed(2), cx + 5 * ls, cy + 20 * ls);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
