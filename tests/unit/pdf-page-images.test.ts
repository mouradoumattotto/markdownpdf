import { describe, expect, it } from "vitest";
import { findImagePaints, unitSquareBox } from "@/lib/pdf-page-images";

const OPS = { save: 10, restore: 11, transform: 12, paintFormXObjectBegin: 74, paintFormXObjectEnd: 75, paintImageXObject: 85, paintInlineImageXObject: 86 };

describe("findImagePaints", () => {
  it("places an image from the current transformation matrix", () => {
    const paints = findImagePaints(
      [OPS.save, OPS.transform, OPS.paintImageXObject, OPS.restore],
      [null, [320, 0, 0, 240, 56, 480], ["img_p0_1"], null],
      OPS,
    );
    expect(paints).toEqual([{ objId: "img_p0_1", inline: null, box: { left: 56, right: 376, bottom: 480, top: 720 } }]);
  });

  it("restores the matrix after save/restore and composes form XObject matrices", () => {
    const paints = findImagePaints(
      [
        OPS.save, OPS.transform, OPS.restore, // a transform that must not leak
        OPS.paintFormXObjectBegin, OPS.transform, OPS.paintImageXObject, OPS.paintFormXObjectEnd,
        OPS.transform, OPS.paintImageXObject,
      ],
      [
        null, [9, 0, 0, 9, 999, 999], null,
        [[1, 0, 0, 1, 100, 200], [0, 0, 10, 10]], [50, 0, 0, 50, 0, 0], ["a"], null,
        [10, 0, 0, 10, 5, 5], ["b"],
      ],
      OPS,
    );
    expect(paints.map((p) => [p.objId, p.box])).toEqual([
      ["a", { left: 100, right: 150, bottom: 200, top: 250 }],
      ["b", { left: 5, right: 15, bottom: 5, top: 15 }],
    ]);
  });

  it("handles rotated placements", () => {
    // 90° rotation: the unit square's box is still found.
    expect(unitSquareBox([0, 100, -50, 0, 200, 300])).toEqual({ left: 150, right: 200, bottom: 300, top: 400 });
  });
});
