import { describe, test, expect } from 'vitest';
import { generateAnalogous } from '../palettes/analogous';
import { generateComplementary } from '../palettes/complementary';
import { generateTriadic } from '../palettes/triadic';
import { generateTetradic } from '../palettes/tetradic';
import { createColorFromHex } from '../colorFactory';

describe('Palette Generation', () => {
  const red = createColorFromHex('#FF0000');

  test('generateAnalogous creates correct number of colors', () => {
    const palette = generateAnalogous(red, { count: 5 });
    expect(palette).toHaveLength(5);
  });

  test('generateComplementary creates 2 colors', () => {
    const palette = generateComplementary(red);
    expect(palette).toHaveLength(2);
  });

  test('generateTriadic creates 3 colors', () => {
    const palette = generateTriadic(red);
    expect(palette).toHaveLength(3);
  });

  test('generateTetradic creates 4 colors', () => {
    const palette = generateTetradic(red);
    expect(palette).toHaveLength(4);
  });

  test('complementary colors have 180° hue difference', () => {
    const palette = generateComplementary(red);
    const hueDiff = Math.abs(palette[0].hsl.h - palette[1].hsl.h);
    expect(hueDiff).toBe(180);
  });

  test('triadic colors have 120° hue spacing', () => {
    const palette = generateTriadic(red);
    expect(palette[1].hsl.h).toBeCloseTo(120, 0);
    expect(palette[2].hsl.h).toBeCloseTo(240, 0);
  });
});
