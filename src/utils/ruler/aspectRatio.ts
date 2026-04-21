/**
 * 종횡비 계산 및 간소화
 */
export function calculateAspectRatio(width: number, height: number): {
  decimal: number;
  ratio: string;
  common?: string;
} {
  const decimal = width / height;
  const gcd = getGCD(Math.round(width), Math.round(height));
  const simplifiedWidth = Math.round(width) / gcd;
  const simplifiedHeight = Math.round(height) / gcd;
  const ratio = `${simplifiedWidth}:${simplifiedHeight}`;
  const common = getCommonAspectRatio(decimal);

  return {
    decimal,
    ratio,
    common,
  };
}

/**
 * 최대공약수 계산
 */
function getGCD(a: number, b: number): number {
  return b === 0 ? a : getGCD(b, a % b);
}

/**
 * 일반적인 종횡비 이름 반환
 */
function getCommonAspectRatio(decimal: number): string | undefined {
  const ratios: Record<string, number> = {
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '16:10': 16 / 10,
    '21:9': 21 / 9,
    '3:2': 3 / 2,
    '5:4': 5 / 4,
  };

  const tolerance = 0.01;

  for (const [name, value] of Object.entries(ratios)) {
    if (Math.abs(decimal - value) < tolerance) {
      return name;
    }
  }

  return undefined;
}

/**
 * 비율 유지하며 크기 조정
 */
export function scaleToAspectRatio(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: targetWidth / aspectRatio,
    };
  }

  if (targetHeight && !targetWidth) {
    return {
      width: targetHeight * aspectRatio,
      height: targetHeight,
    };
  }

  return {
    width: originalWidth,
    height: originalHeight,
  };
}
