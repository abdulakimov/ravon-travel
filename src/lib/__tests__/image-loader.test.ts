import { describe, expect, it } from "vitest";
import imageLoader from "../image-loader";

describe("imageLoader", () => {
  it("maps local photos to the pre-built WebP of the next width up", () => {
    expect(imageLoader({ src: "/img/tour-az.jpg", width: 384 })).toBe("/img/opt/tour-az-384.webp");
    expect(imageLoader({ src: "/img/tour-az.jpg", width: 400 })).toBe("/img/opt/tour-az-640.webp");
    expect(imageLoader({ src: "/img/hero-dubai.jpg", width: 1200 })).toBe("/img/opt/hero-dubai-1200.webp");
  });

  it("never asks for a width that was not generated", () => {
    expect(imageLoader({ src: "/img/cta.jpg", width: 3840 })).toBe("/img/opt/cta-1200.webp");
  });

  it("leaves other sources untouched", () => {
    expect(imageLoader({ src: "/icon.svg", width: 64 })).toBe("/icon.svg");
    expect(imageLoader({ src: "https://example.com/a.jpg", width: 640 })).toBe("https://example.com/a.jpg");
  });
});
