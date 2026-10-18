import "@testing-library/jest-dom/vitest";

// jsdom does not implement these; the app guards against a missing canvas context.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement["getContext"];
