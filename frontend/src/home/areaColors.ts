/** Theme tokens (CSS variables) used to colour areas. Areas not listed here cycle through the palette, so a new area just works. */
const PALETTE = ["c-teal", "brand", "c-purple", "c-amber", "pos", "ok", "neg", "muted"];
const PINNED: Record<string, string> = {
  data: "c-teal", core: "brand", training: "c-purple", generalisation: "c-amber",
  vision: "pos", sequences: "ok", advanced: "neg", engineering: "muted",
};
export const areaToken = (areaId: string, index: number) => PINNED[areaId] ?? PALETTE[index % PALETTE.length];
export const tokenColor = (token: string, alpha?: number) => (alpha === undefined ? `rgb(var(--${token}))` : `rgb(var(--${token}) / ${alpha})`);
