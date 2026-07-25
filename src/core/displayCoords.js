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

/**
 * @module displayCoords
 * @description Conversion between the internal scene coordinates and the coordinates presented to
 * (and accepted from) the user.
 *
 * Internally - and in the saved scene JSON - the scene uses the computer graphics convention, where
 * the y-axis points downwards. The user-facing convention is the usual mathematical one: x increases
 * to the right and y increases upwards. Every coordinate readout and every coordinate input in the
 * UI therefore goes through the helpers below, so that the flip lives in exactly one place. Nothing
 * about the stored scene, the rendering or the simulation itself is affected.
 *
 * Angles are already reported in the mathematical convention (see `getScreenAngle` in
 * `sceneObjs/objBarUtils.js`), so they need no conversion here.
 *
 * Note that the local coordinate system of a user-supplied formula (the `n(x,y)` of a GRIN glass,
 * the `x(t)`/`y(t)` of a parametric curve) keeps the internal downwards y-axis; only the scene
 * position of its origin is shown in the user-facing convention.
 */

/**
 * Flip the y-axis. This is its own inverse, so the same operation converts in both directions; the
 * two named exports below exist only to make the intended direction explicit at each call site.
 * Zero is mapped to `0` rather than `-0`, which would otherwise leak into some readouts.
 * @param {number} y - The y coordinate.
 * @returns {number} The flipped y coordinate.
 */
const flipY = y => y === 0 ? 0 : -y;

/**
 * Convert a y coordinate from the internal scene convention to the user-facing one.
 * @param {number} y - The y coordinate in scene coordinates.
 * @returns {number} The y coordinate to display.
 */
export const toDisplayY = flipY;

/**
 * Convert a y coordinate from the user-facing convention (e.g. as entered by the user) to the
 * internal scene convention.
 * @param {number} y - The displayed y coordinate.
 * @returns {number} The y coordinate in scene coordinates.
 */
export const fromDisplayY = flipY;

/**
 * Convert a point from the internal scene convention to the user-facing one.
 * @param {Point} p - The point in scene coordinates.
 * @returns {Point} The point to display.
 */
export const toDisplayPoint = p => ({ x: p.x, y: flipY(p.y) });

/**
 * Convert a point from the user-facing convention (e.g. as entered by the user) to the internal
 * scene convention.
 * @param {Point} p - The displayed point.
 * @returns {Point} The point in scene coordinates.
 */
export const fromDisplayPoint = p => ({ x: p.x, y: flipY(p.y) });
