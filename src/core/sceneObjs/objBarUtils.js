/*
 * Copyright 2024 The Ray Optics Simulation authors and contributors
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

import geometry from '../geometry.js';

/**
 * Format a point as a coordinate tuple string for display in the object bar.
 * @param {Point} p - The point.
 * @returns {string} The formatted string "(x, y)".
 */
export const formatCoordinates = p => '(' + (Math.round(p.x * 1000000) / 1000000) + ', ' + (Math.round(p.y * 1000000) / 1000000) + ')';

/**
 * Parse a coordinate tuple string (e.g. "(10, 20)" or "10, 20") entered in the object bar. Full-width parentheses and commas from CJK input methods are also accepted.
 * @param {string} value - The input string.
 * @returns {Point|null} The parsed point, or null if the input is invalid.
 */
export const parseCoordinates = value => {
  const parts = String(value).replace(/[()（）\s]/g, '').split(/[,，]/);
  if (parts.length !== 2) return null;
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  if (isNaN(x) || isNaN(y)) return null;
  return geometry.point(x, y);
};

/**
 * Get the angle of the directed segment from `p1` to `p2`, in degrees, as seen on the screen: measured counterclockwise from the positive x-axis. Since the internal y-axis points downwards, the sign is flipped with respect to `Math.atan2`.
 * @param {Point} p1 - The first point.
 * @param {Point} p2 - The second point.
 * @returns {number} The angle in degrees, within (-180, 180].
 */
export const getScreenAngle = (p1, p2) => -Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
