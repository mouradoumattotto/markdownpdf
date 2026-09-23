import { describe, expect, it } from "vitest";
import { jpegOrientation, layoutImage, renderScale } from "@/lib/pdf-images";

/** A minimal JPEG header with an EXIF APP1 segment holding one Orientation tag. */
function jpegWithOrientation(value: number, littleEndian: boolean): Uint8Array {
  const tiff: number[] = littleEndian
    ? [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, value, 0x00, 0x00, 0x00, 0, 0, 0, 0]
    : [0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, value, 0x00, 0x00, 0, 0, 0, 0];
  const exif = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff];
  const size = exif.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, size >> 8, size & 0xff, ...exif, 0xff, 0xda, 0, 2]);
}

describe("jpegOrientation", () => {
  it("reads the EXIF orientation in both byte orders", () => {
    expect(jpegOrientation(jpegWithOrientation(6, true))).toBe(6);
    expect(jpegOrientation(jpegWithOrientation(8, false))).toBe(8);
  });

  it("defaults to upright for no EXIF, garbage, or truncated data", () => {
    expect(jpegOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBe(1);
    expect(jpegOrientation(new Uint8Array([1, 2, 3]))).toBe(1);
    expect(jpegOrientation(jpegWithOrientation(6, true).slice(0, 20))).toBe(1);
    expect(jpegOrientation(jpegWithOrientation(42, true))).toBe(1);
  });
});

describe("renderScale", () => {
  it("renders at the requested dpi", () => {
    expect(renderScale(595, 842, 150)).toEqual({ scale: 150 / 72, reduced: false });
  });

  it("caps enormous pages instead of failing", () => {
    // An A0 poster at 600 dpi would be ~19,800 × 28,000 px.
    const { scale, reduced } = renderScale(2384, 3370, 600);
    expect(reduced).toBe(true);
    expect(3370 * scale).toBeLessThanOrEqual(12_000);
    expect(2384 * scale * 3370 * scale).toBeLessThanOrEqual(60_000_000 + 1);
  });
});

describe("layoutImage", () => {
  it("uses the image's own size for 'fit'", () => {
    expect(layoutImage(300, 200, { pageSize: "fit", orientation: "auto", margin: 20 })).toMatchObject({
      pageWidth: 300,
      pageHeight: 200,
      x: 0,
      y: 0,
    });
  });

  it("scales a large photo down into A4, centred within the margins", () => {
    const box = layoutImage(3000, 4000, { pageSize: "a4", orientation: "auto", margin: 36 });
    expect(box.pageWidth).toBeCloseTo(595.28);
    expect(box.width).toBeCloseTo(595.28 - 72);
    expect(box.x).toBeCloseTo((595.28 - box.width) / 2);
  });

  it("turns the page for wide images in auto mode, and never enlarges small ones", () => {
    const wide = layoutImage(400, 100, { pageSize: "letter", orientation: "auto", margin: 0 });
    expect(wide.pageWidth).toBe(792);
    expect(wide.width).toBe(400);
    const forced = layoutImage(400, 100, { pageSize: "letter", orientation: "portrait", margin: 0 });
    expect(forced.pageWidth).toBe(612);
  });
});
