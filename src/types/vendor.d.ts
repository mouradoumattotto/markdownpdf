// Minimal typings for two dependencies that ship none. Kept deliberately
// narrow: only what this codebase calls, so a wrong call is still a type error.

declare module "@joplin/turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export const gfm: TurndownService.Plugin;
  export const tables: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
}

declare module "mammoth/mammoth.browser.js" {
  export interface MammothImage {
    contentType: string;
    read(encoding?: string): Promise<string | ArrayBuffer>;
  }
  export interface MammothResult {
    value: string;
    messages: { type: string; message: string }[];
  }
  export interface MammothOptions {
    convertImage?: unknown;
    styleMap?: string | string[];
  }
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }, options?: MammothOptions): Promise<MammothResult>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  export const images: {
    imgElement(fn: (image: MammothImage) => Promise<{ src: string; alt?: string }>): unknown;
  };
}
