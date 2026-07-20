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
 *
 * Incident rays that carry a `diffractionOrder` (set by `DiffractionGrating` and
 * `ConcaveDiffractionGrating` on the rays they diffract) are tracked in their own group,
 * keyed by that order, so that e.g. the m=0, +1, -1 spots of a grating landing on a
 * downstream mirror are reported separately instead of being blended into one centroid.
 * Rays without a `diffractionOrder` (ordinary reflections) are tracked together in a
 * single "default" group, matching the pre-existing single-spot behavior.
 *
 * Each group's text block can be dragged (e.g. to separate labels of nearby/overlapping
 * spots): `drawSpotInfo` caches each drawn block's hit box in `obj.spotInfoBoxes`, which
 * `checkSpotInfoMouseOver`/`dragSpotInfoText` consult to let the host object's own
 * `checkMouseOver`/`onDrag` support dragging the label. The dragged offset (relative to the
 * group's centroid) is persisted per group key in `obj.spotInfoTextOffsets`, which the host
 * class should include in its `serializableDefaults` (as `spotInfoTextOffsets: {}`) so the
 * arrangement survives save/load.
 *
 * A host class whose surface shape has a well-defined local tangent/normal (e.g. a line
 * segment) can additionally pass the ray's angle of incidence to `recordSpotInfoHit`, which
 * then shows a brightness-weighted average "Angle=" line alongside Pos/Size, grouped and
 * labeled the same way as the m=0/+1/-1 groups above. This is opt-in per call site; omitting
 * it (the default) keeps the pre-existing Pos/Size-only display.
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
  obj.spotGroups = {};
}

/**
 * The key used to index `obj.spotGroups` and `obj.spotInfoTextOffsets` for a given order.
 * @param {number|null} order - The diffraction order, or `null` for ordinary (non-diffracted) rays.
 * @returns {string}
 */
function groupKeyOf(order) {
  return order === null ? 'default' : String(order);
}

/**
 * Get (creating if necessary) the accumulator for a given diffraction order key.
 * @param {Object} obj - The scene object instance.
 * @param {number|null} order - The diffraction order, or `null` for ordinary (non-diffracted) rays.
 * @returns {Object}
 */
function getSpotGroup(obj, order) {
  const key = groupKeyOf(order);
  let group = obj.spotGroups[key];
  if (!group) {
    group = obj.spotGroups[key] = {
      order,
      hitCount: 0,
      sumX: 0,
      sumY: 0,
      sumWeight: 0,
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
      hasAngle: false,
      sumAngle: 0,
      sumAngleWeight: 0
    };
  }
  return group;
}

/**
 * Record a ray hit for the spot statistics. Should be called from `onRayIncident`.
 * Does nothing if `showSpotInfo` is off, to avoid the bookkeeping cost when not needed.
 * Rays produced by a diffraction grating (carrying a `diffractionOrder`, e.g. 0, +1, -1)
 * are accumulated separately per order, so their spots can be reported individually.
 * @param {Object} obj - The scene object instance.
 * @param {Point} incidentPoint - The point where the ray hit the surface.
 * @param {Ray} ray - The incident ray (its brightness is used as the weight).
 * @param {number} [incidenceAngle] - The angle of incidence (from the surface normal, in
 *   radians, in [0, π/2]), if the caller's surface shape supports computing it. When given,
 *   the brightness-weighted average angle is tracked per group and shown as an extra line by
 *   `drawSpotInfo`. Omit for shapes that don't (yet) compute this.
 */
export function recordSpotInfoHit(obj, incidentPoint, ray, incidenceAngle) {
  if (!obj.showSpotInfo) return;

  const order = Number.isInteger(ray.diffractionOrder) ? ray.diffractionOrder : null;
  const group = getSpotGroup(obj, order);

  group.hitCount++;

  const weight = ray.brightness_s + ray.brightness_p;
  const w = weight > 0 ? weight : 0;
  group.sumX += incidentPoint.x * w;
  group.sumY += incidentPoint.y * w;
  group.sumWeight += w;

  if (incidentPoint.x < group.minX) group.minX = incidentPoint.x;
  if (incidentPoint.x > group.maxX) group.maxX = incidentPoint.x;
  if (incidentPoint.y < group.minY) group.minY = incidentPoint.y;
  if (incidentPoint.y > group.maxY) group.maxY = incidentPoint.y;

  if (typeof incidenceAngle === 'number') {
    group.hasAngle = true;
    group.sumAngle += incidenceAngle * w;
    group.sumAngleWeight += w;
  }
}

/**
 * Draw the spot info text overlay (position, size, and, when available, angle of incidence),
 * if enabled and data is available. One line group is drawn per diffraction-order group that
 * received hits (see `recordSpotInfoHit`), each near its own centroid (offset by any manual
 * drag, see `dragSpotInfoText`), prefixed with "m=<order>" when it corresponds to a
 * diffraction order rather than the default (non-diffracted) group. A third "Angle=" line is
 * added below Pos/Size for groups whose hits carried an incidence angle.
 * Should be called at the end of `draw`, unconditionally (it checks `isAboveLight` itself
 * so that it is only drawn once, in the same layer as the Detector's readout). Also
 * (re)builds `obj.spotInfoBoxes`, the hit-test cache used by `checkSpotInfoMouseOver`.
 * @param {Object} obj - The scene object instance.
 * @param {CanvasRenderer} canvasRenderer - The canvas renderer.
 * @param {boolean} isAboveLight - Whether the rendering layer is above the light layer.
 * @param {boolean} isHovered - Whether the object is hovered by the mouse.
 */
export function drawSpotInfo(obj, canvasRenderer, isAboveLight, isHovered) {
  if (!obj.showSpotInfo || !isAboveLight) return;

  // Rebuilt every draw, so a group that stops receiving hits (or the whole feature being
  // turned off) doesn't leave a stale, undraggable hit box behind.
  obj.spotInfoBoxes = [];

  if (!obj.spotGroups) return;

  const groups = Object.values(obj.spotGroups)
    .filter(group => group.hitCount > 0)
    .sort((a, b) => (a.order ?? -Infinity) - (b.order ?? -Infinity));

  if (groups.length === 0) return;

  const ctx = canvasRenderer.ctx;
  const ls = canvasRenderer.lengthScale;
  const lineHeight = 15 * ls;

  if (!obj.scene.simulator?.isLightLayerSynced) {
    // If the light layer is not synced, gray out the readings to indicate that they are not up to date.
    ctx.globalAlpha = 0.5;
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.font = (obj.scene.theme.detectorText.size * ls) + 'px ' + obj.scene.theme.detectorText.font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = isHovered ? obj.scene.highlightColorCss : canvasRenderer.rgbaToCssColor(obj.scene.theme.detectorText.color);

  for (const group of groups) {
    const size = Math.hypot(group.maxX - group.minX, group.maxY - group.minY);
    const cx = group.sumWeight > 0 ? group.sumX / group.sumWeight : (group.minX + group.maxX) / 2;
    const cy = group.sumWeight > 0 ? group.sumY / group.sumWeight : (group.minY + group.maxY) / 2;

    const key = groupKeyOf(group.order);
    const offset = (obj.spotInfoTextOffsets && obj.spotInfoTextOffsets[key]) || { x: 5 * ls, y: 5 * ls };
    const anchorX = cx + offset.x;
    const anchorY = cy + offset.y;

    const prefix = group.order === null ? '' : `m=${group.order > 0 ? '+' : ''}${group.order} `;
    const posText = prefix + 'Pos=(' + cx.toFixed(2) + ', ' + cy.toFixed(2) + ')';
    const sizeText = prefix + 'Size=' + size.toFixed(2);
    ctx.fillText(posText, anchorX, anchorY);
    ctx.fillText(sizeText, anchorX, anchorY + lineHeight);

    let width = Math.max(ctx.measureText(posText).width, ctx.measureText(sizeText).width);
    let lineCount = 2;

    if (group.hasAngle) {
      const avgAngleDeg = (group.sumAngleWeight > 0 ? group.sumAngle / group.sumAngleWeight : 0) * 180 / Math.PI;
      const angleText = prefix + 'Angle=' + avgAngleDeg.toFixed(2) + '°';
      ctx.fillText(angleText, anchorX, anchorY + 2 * lineHeight);
      width = Math.max(width, ctx.measureText(angleText).width);
      lineCount = 3;
    }

    obj.spotInfoBoxes.push({ key, x: anchorX, y: anchorY, width, height: lineCount * lineHeight });
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Check whether the mouse is over one of the spot info text blocks drawn in the last
 * `drawSpotInfo` call, and if so return a drag context for moving it. Should be called at
 * the very start of the host object's `checkMouseOver`, before its own shape hit-testing, so
 * that grabbing a label takes priority over dragging the object underneath it. Uses
 * `part: -1` (no host object uses this for a real part) so the editor doesn't treat it as
 * a whole-object drag (which would offer to duplicate the object on Ctrl-drag).
 * @param {Object} obj - The scene object instance.
 * @param {Mouse} mouse - The mouse.
 * @returns {Object|undefined} A drag context, or `undefined` if the mouse isn't over a label.
 */
export function checkSpotInfoMouseOver(obj, mouse) {
  if (!obj.showSpotInfo || !obj.spotInfoBoxes) return;

  // Iterate back-to-front (most recently drawn first) so that, when two labels overlap
  // exactly, the one on top (visually) is the one grabbed.
  for (let i = obj.spotInfoBoxes.length - 1; i >= 0; i--) {
    const box = obj.spotInfoBoxes[i];
    if (mouse.pos.x >= box.x && mouse.pos.x <= box.x + box.width &&
        mouse.pos.y >= box.y && mouse.pos.y <= box.y + box.height) {
      return {
        part: -1,
        cursor: 'move',
        isSpotInfoDrag: true,
        spotInfoKey: box.key,
        spotInfoGrabDX: mouse.pos.x - box.x,
        spotInfoGrabDY: mouse.pos.y - box.y
      };
    }
  }
}

/**
 * Move a spot info text block being dragged. Should be called from the host object's
 * `onDrag` when `dragContext.isSpotInfoDrag` is true (checked and returned early, skipping
 * the object's own `onDrag` logic).
 * @param {Object} obj - The scene object instance.
 * @param {Mouse} mouse - The mouse.
 * @param {Object} dragContext - The drag context returned by `checkSpotInfoMouseOver`.
 */
export function dragSpotInfoText(obj, mouse, dragContext) {
  const group = obj.spotGroups && obj.spotGroups[dragContext.spotInfoKey];
  if (!group) return;

  const cx = group.sumWeight > 0 ? group.sumX / group.sumWeight : (group.minX + group.maxX) / 2;
  const cy = group.sumWeight > 0 ? group.sumY / group.sumWeight : (group.minY + group.maxY) / 2;

  if (!obj.spotInfoTextOffsets) obj.spotInfoTextOffsets = {};
  obj.spotInfoTextOffsets[dragContext.spotInfoKey] = {
    x: mouse.pos.x - dragContext.spotInfoGrabDX - cx,
    y: mouse.pos.y - dragContext.spotInfoGrabDY - cy
  };
}
