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

import DiffractionGrating from '../../../src/core/sceneObjs/blocker/DiffractionGrating';
import Scene from '../../../src/core/Scene';
import { testLineObj } from '../helpers/lineObjTests';
import { MockUser } from '../helpers/test-utils';

describe('DiffractionGrating', () => {
  let scene;
  let obj;
  let user;

  beforeEach(() => {
    scene = new Scene();
    obj = new DiffractionGrating(scene);
    user = new MockUser(obj);
  });

  testLineObj(() => ({ obj, user }));

  it('rotates 90 degrees around default center (midpoint)', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.rotate(Math.PI / 2); // 90 degrees counter-clockwise
    const result = obj.serialize();
    expect(result.p1.x).toBeCloseTo(250, 5);
    expect(result.p1.y).toBeCloseTo(150, 5);
    expect(result.p2.x).toBeCloseTo(50, 5);
    expect(result.p2.y).toBeCloseTo(250, 5);
    expect(result.type).toBe('DiffractionGrating');
  });

  it('scales to 50% around default center (midpoint)', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.scale(0.5); // Scale to 50%
    const result = obj.serialize();
    expect(result.p1.x).toBeCloseTo(125, 5);
    expect(result.p1.y).toBeCloseTo(150, 5);
    expect(result.p2.x).toBeCloseTo(175, 5);
    expect(result.p2.y).toBeCloseTo(250, 5);
    expect(result.type).toBe('DiffractionGrating');
  });

  it('sets properties without custom brightness', () => {
    user.click(100, 100);
    user.click(200, 300);
    user.set("{{simulator:sceneObjs.DiffractionGrating.lineDensity}}", 600);
    user.set("{{simulator:sceneObjs.DiffractionGrating.mirrored}}", true);
    user.set("{{simulator:sceneObjs.DiffractionGrating.slitRatio}}", 0.7);

    expect(obj.serialize()).toEqual({
      type: "DiffractionGrating",
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 300 },
      lineDensity: 600,
      mirrored: true,
      slitRatio: 0.7
    });
  });

  it('sets properties with custom brightness', () => {
    user.click(100, 100);
    user.click(200, 300);
    user.set("{{simulator:sceneObjs.DiffractionGrating.lineDensity}}", 600);
    user.set("{{simulator:sceneObjs.DiffractionGrating.mirrored}}", true);
    user.set("{{simulator:sceneObjs.DiffractionGrating.customBrightness}}", true);
    user.set("{{simulator:sceneObjs.DiffractionGrating.customBrightness}}", '1, 0.7, 0.7, 0.3, 0.3', 1);

    expect(obj.serialize()).toEqual({
      type: "DiffractionGrating",
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 300 },
      lineDensity: 600,
      mirrored: true,
      customBrightness: true,
      brightnesses: [1, 0.7, 0.7, 0.3, 0.3]
    });
  });

  it('only offers "color by order" once mirrored is on, and sets the order colors', () => {
    user.click(100, 100);
    user.click(200, 300);

    const colorByOrderLabel = "{{simulator:sceneObjs.DiffractionGrating.colorByOrder}}";
    expect(user.get(colorByOrderLabel)).toBeNull();

    user.set("{{simulator:sceneObjs.DiffractionGrating.mirrored}}", true);
    expect(user.get(colorByOrderLabel)).toBe(false);

    user.set(colorByOrderLabel, true);
    user.set("{{simulator:sceneObjs.DiffractionGrating.order0Color}}", '#111111');
    user.set("{{simulator:sceneObjs.DiffractionGrating.orderPlus1Color}}", '#222222');
    user.set("{{simulator:sceneObjs.DiffractionGrating.orderMinus1Color}}", '#333333');

    expect(obj.serialize()).toEqual({
      type: "DiffractionGrating",
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 300 },
      mirrored: true,
      colorByOrder: true,
      order0Color: '#111111',
      orderPlus1Color: '#222222',
      orderMinus1Color: '#333333'
    });
  });

  describe('coloring diffracted rays by order', () => {
    // A vertical grating at x=0, hit at normal incidence by a ray traveling in +x.
    // With the default lineDensity (1000) and the default (green) wavelength, this
    // produces exactly the m = -1, 0, +1 orders.
    beforeEach(() => {
      user.click(0, -50);
      user.click(0, 50);
      user.set("{{simulator:sceneObjs.DiffractionGrating.mirrored}}", true);
    });

    function incidentRay() {
      return {
        p1: { x: -100, y: 0 },
        p2: { x: 0, y: 0 },
        brightness_s: 0.5,
        brightness_p: 0.5
      };
    }

    it('tags the m=0, +1, -1 rays with the configured colors when enabled', () => {
      user.set("{{simulator:sceneObjs.DiffractionGrating.colorByOrder}}", true);
      user.set("{{simulator:sceneObjs.DiffractionGrating.order0Color}}", '#111111');
      user.set("{{simulator:sceneObjs.DiffractionGrating.orderPlus1Color}}", '#222222');
      user.set("{{simulator:sceneObjs.DiffractionGrating.orderMinus1Color}}", '#333333');

      const result = obj.onRayIncident(incidentRay(), 0, { x: 0, y: 0 });

      expect(result.newRays.length).toBe(3);
      const colors = result.newRays.map(r => r.colorOverride).sort();
      expect(colors).toEqual(['#111111', '#222222', '#333333']);
    });

    it('does not tag rays when "color by order" is off', () => {
      const result = obj.onRayIncident(incidentRay(), 0, { x: 0, y: 0 });

      expect(result.newRays.length).toBe(3);
      expect(result.newRays.every(r => r.colorOverride === undefined)).toBe(true);
    });

    it('does not tag rays when the grating is not mirrored, even if "color by order" is on', () => {
      user.set("{{simulator:sceneObjs.DiffractionGrating.colorByOrder}}", true);
      user.set("{{simulator:sceneObjs.DiffractionGrating.mirrored}}", false);

      const result = obj.onRayIncident(incidentRay(), 0, { x: 0, y: 0 });

      expect(result.newRays.length).toBe(3);
      expect(result.newRays.every(r => r.colorOverride === undefined)).toBe(true);
    });
  });
});