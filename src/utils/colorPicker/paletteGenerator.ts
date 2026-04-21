import { Color, PaletteType, PaletteOptions } from '../../types/colorPicker';
import { generateAnalogous } from './palettes/analogous';
import { generateComplementary } from './palettes/complementary';
import { generateTriadic } from './palettes/triadic';
import { generateTetradic } from './palettes/tetradic';
import { generateMonochromatic } from './palettes/monochromatic';
import { generateShades } from './palettes/shades';
import { generateTints } from './palettes/tints';

/**
 * 팔레트 타입에 따라 색상 팔레트 생성
 */
export function generatePalette(
  baseColor: Color,
  options: PaletteOptions
): Color[] {
  switch (options.type) {
    case 'analogous':
      return generateAnalogous(baseColor, options);

    case 'complementary':
      return generateComplementary(baseColor, options);

    case 'triadic':
      return generateTriadic(baseColor);

    case 'tetradic':
      return generateTetradic(baseColor);

    case 'monochromatic':
      return generateMonochromatic(baseColor, options);

    case 'shades':
      return generateShades(baseColor, options);

    case 'tints':
      return generateTints(baseColor, options);

    default:
      return [baseColor];
  }
}

/**
 * 모든 팔레트 타입을 한 번에 생성
 */
export function generateAllPalettes(baseColor: Color): Record<PaletteType, Color[]> {
  return {
    analogous: generateAnalogous(baseColor),
    complementary: generateComplementary(baseColor),
    triadic: generateTriadic(baseColor),
    tetradic: generateTetradic(baseColor),
    monochromatic: generateMonochromatic(baseColor),
    shades: generateShades(baseColor),
    tints: generateTints(baseColor),
  };
}
