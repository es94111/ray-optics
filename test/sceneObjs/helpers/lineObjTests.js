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

import { MockUser } from './test-utils';

export function testLineObj(getTestContext) {
  let obj;
  let user;

  beforeEach(() => {
    const context = getTestContext();
    obj = context.obj;
    user = context.user;
  });

  it('creates with two clicks', () => {
    user.click(101, 102);
    user.click(203, 304);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 101, y: 102 },
      p2: { x: 203, y: 304 },
    });
  });

  it('creates with one drag', () => {
    user.drag(101, 102, 203, 304);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 101, y: 102 },
      p2: { x: 203, y: 304 },
    });
  });

  it('creates with grid snapping', () => {
    user.setScene('snapToGrid', true);
    user.drag(101, 102, 203, 304);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 300 },
    });
  });

  it('creates with shift + drag horizontally', () => {
    user.shiftDrag(100, 100, 200, 110);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 100 },
    });
  });

  it('creates with shift + drag vertically', () => {
    user.shiftDrag(100, 100, 110, 200);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 100, y: 200 },
    });
  });

  it('creates with shift + drag diagonally', () => {
    user.shiftDrag(100, 100, 210, 190);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 200 },
    });
  });

  it('creates with ctrl + drag', () => {
    user.ctrlDrag(100, 100, 200, 300);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 0, y: -100 },
      p2: { x: 200, y: 300 },
    });
  });

  it('creates with ctrl + shift + drag horizontally', () => {
    user.ctrlShiftDrag(100, 100, 200, 110);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 0, y: 100 },
      p2: { x: 200, y: 100 },
    });
  });

  it('hovers with mouse', () => {
    user.click(100, 100);
    user.click(200, 300);
    
    expect(user.hover(101, 101)).toBeTruthy();
    expect(user.hover(201, 301)).toBeTruthy();
    expect(user.hover(101, 301)).toBeFalsy();
    expect(user.hover(201, 101)).toBeFalsy();
    expect(user.hover(151, 201)).toBeTruthy();
    expect(user.hover(300, 500)).toBeFalsy();
  });

  it('drags with mouse', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.drag(101, 101, 200, 200);
    user.drag(201, 301, 300, 400);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 200 },
      p2: { x: 300, y: 400 },
    });
  });

  it('drags with mouse with grid snapping', () => {
    user.click(100, 100);
    user.click(200, 300);
    user.setScene('snapToGrid', true);

    user.drag(101, 101, 201, 201);
    user.drag(201, 301, 301, 401);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 200 },
      p2: { x: 300, y: 400 },
    });
  });

  it('shift + drags second point horizontally', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(200, 300, 110, 200);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 100, y: 200 },
    });
  });

  it('shift + drags first point horizontally', () => {
    user.click(200, 300);
    user.click(100, 100);

    user.shiftDrag(200, 300, 110, 200);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 200 },
      p2: { x: 100, y: 100 },
    });
  });

  it('shift + drags second point vertically', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(200, 300, 110, 200);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 100, y: 200 },
    });
  });

  it('shift + drags first point vertically', () => {
    user.click(200, 300);
    user.click(100, 100);

    user.shiftDrag(200, 300, 110, 200);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 200 },
      p2: { x: 100, y: 100 },
    });
  });

  it('shift + drags second point diagonally', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(200, 300, 210, 190);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 200 },
    });
  });

  it('shift + drags first point diagonally', () => {
    user.click(200, 300);
    user.click(100, 100);

    user.shiftDrag(200, 300, 210, 190);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 200 },
      p2: { x: 100, y: 100 },
    });
  });

  it('shift + drags second point with same slope', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(200, 300, 302, 499);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 100 },
      p2: { x: 300, y: 500 },
    });
  });

  it('shift + drags first point with same slope', () => {
    user.click(200, 300);
    user.click(100, 100);

    user.shiftDrag(200, 300, 302, 499);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 300, y: 500 },
      p2: { x: 100, y: 100 },
    });
  });

  it('ctrl + drags second point', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.ctrlDrag(200, 300, 300, 400);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 0, y: 0 },
      p2: { x: 300, y: 400 },
    });
  });

  it('ctrl + drags first point', () => {
    user.click(200, 300);
    user.click(100, 100);

    user.ctrlDrag(200, 300, 300, 400);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 300, y: 400 },
      p2: { x: 0, y: 0 },
    });
  });

  it('ctrl + shift + drags second point horizontally', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.ctrlShiftDrag(200, 300, 200, 210);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 200 },
      p2: { x: 200, y: 200 },
    });
  });

  it('ctrl + shift + drags first point horizontally', () => {
    user.click(200, 300);
    user.click(100, 100);

    user.ctrlShiftDrag(200, 300, 200, 210);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 200 },
      p2: { x: 100, y: 200 },
    });
  });

  it('drags the whole object', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.drag(151, 201, 251, 401);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 300 },
      p2: { x: 300, y: 500 },
    });
  });

  it('shift + drags the whole object horizontally', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(151, 201, 251, 211);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 100 },
      p2: { x: 300, y: 300 },
    });
  });

  it('shift + drags the whole object vertically', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(151, 201, 161, 401);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 100, y: 300 },
      p2: { x: 200, y: 500 },
    });
  });

  it('shift + drags the whole object with same slope', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(151, 201, 253, 400);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 200, y: 300 },
      p2: { x: 300, y: 500 },
    });
  });

  it('shift + drags the whole object with opposite slope', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.shiftDrag(151, 201, 352, 103);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 300, y: 0 },
      p2: { x: 400, y: 200 },
    });
  });

  it('moves the entire object by a vector', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.move(50, 100);
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 150, y: 200 },
      p2: { x: 250, y: 400 },
    });
  });

  it('rotates 90 degrees around explicit center', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.rotate(Math.PI / 2, { x: 0, y: 0 }); // 90 degrees around origin
    const result = obj.serialize();
    expect(result.p1.x).toBeCloseTo(-100, 5);
    expect(result.p1.y).toBeCloseTo(100, 5);
    expect(result.p2.x).toBeCloseTo(-300, 5);
    expect(result.p2.y).toBeCloseTo(200, 5);
    expect(result.type).toBe(obj.constructor.type);
  });

  it('scales to 50% around explicit center', () => {
    user.click(100, 100);
    user.click(200, 300);

    user.scale(0.5, { x: 0, y: 0 }); // Scale to 50% around origin
    const result = obj.serialize();
    expect(result.p1.x).toBeCloseTo(50, 5);
    expect(result.p1.y).toBeCloseTo(50, 5);
    expect(result.p2.x).toBeCloseTo(100, 5);
    expect(result.p2.y).toBeCloseTo(150, 5);
    expect(result.type).toBe(obj.constructor.type);
  });

  it('shows and edits endpoint coordinates in the object bar', () => {
    user.drag(100, 100, 200, 100);

    const schema = obj.constructor.getPropertySchema(obj.serialize(), obj.scene);
    const p1Label = (schema.find(item => item.key === 'p1') || {}).label || '{{simulator:sceneObjs.LineObjMixin.endpoint1}}';
    const p2Label = (schema.find(item => item.key === 'p2') || {}).label || '{{simulator:sceneObjs.LineObjMixin.endpoint2}}';

    expect(user.getValue(p1Label)).toBe('(100, 100)');
    expect(user.getValue(p2Label)).toBe('(200, 100)');

    user.set(p1Label, '(50, 80)');
    user.set(p2Label, '250, 120');
    expect(obj.serialize()).toEqual({
      type: obj.constructor.type,
      p1: { x: 50, y: 80 },
      p2: { x: 250, y: 120 },
    });
  });

  it('shows and edits the center in the object bar', () => {
    user.drag(100, 100, 200, 100);

    const centerLabel = '{{simulator:sceneObjs.LineObjMixin.center}}';
    const initialCenter = obj.getDefaultCenter();
    expect(user.getValue(centerLabel)).toBe('(' + initialCenter.x + ', ' + initialCenter.y + ')');

    user.set(centerLabel, '(300, 400)');
    const newCenter = obj.getDefaultCenter();
    expect(newCenter.x).toBeCloseTo(300, 5);
    expect(newCenter.y).toBeCloseTo(400, 5);
    // The shape is preserved when moving by the center
    expect(obj.p2.x - obj.p1.x).toBeCloseTo(100, 5);
    expect(obj.p2.y - obj.p1.y).toBeCloseTo(0, 5);
  });

  it('shows and edits the rotation angle in the object bar', () => {
    user.drag(100, 100, 200, 100);

    const angleLabel = '{{simulator:sceneObjs.LineObjMixin.rotationAngle}}';
    expect(user.getValue(angleLabel)).toBeCloseTo(0, 5);

    const initialCenter = { ...obj.getDefaultCenter() };
    user.set(angleLabel, 90);
    expect(obj.getScreenAngle()).toBeCloseTo(90, 5);
    expect(user.getValue(angleLabel)).toBeCloseTo(90, 5);
    // The length and the default center are preserved
    expect(Math.hypot(obj.p2.x - obj.p1.x, obj.p2.y - obj.p1.y)).toBeCloseTo(100, 5);
    const newCenter = obj.getDefaultCenter();
    expect(newCenter.x).toBeCloseTo(initialCenter.x, 5);
    expect(newCenter.y).toBeCloseTo(initialCenter.y, 5);
    // The angle is counterclockwise as seen on the screen, and the internal y-axis points downwards, so the second point ends up above the first one
    expect(obj.p2.y).toBeLessThan(obj.p1.y);
  });
} 