import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// TZ L1: har bir sahifa uch tilda to'liq — uchala tilda kalitlar aynan bir xil bo'lishi shart.
const root = join(__dirname, "../../../messages");
const locales = ["uz", "ru", "en"] as const;

function keys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

function leaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(leaves);
  return [];
}

describe("translations", () => {
  const files = readdirSync(join(root, "uz")).filter((f) => f.endsWith(".json"));

  it.each(files)("%s has identical keys in uz/ru/en", (file) => {
    const [uz, ru, en] = locales.map((l) => keys(JSON.parse(readFileSync(join(root, l, file), "utf8"))).sort());
    expect(ru).toEqual(uz);
    expect(en).toEqual(uz);
  });

  it.each(files)("%s has no empty strings or raw {PLACEHOLDER}s", (file) => {
    for (const l of locales) {
      for (const text of leaves(JSON.parse(readFileSync(join(root, l, file), "utf8")))) {
        expect(text.trim().length, `${l}/${file}`).toBeGreaterThan(0);
        expect(text, `${l}/${file}`).not.toMatch(/\{[A-Z_]{3,}\}/);
      }
    }
  });
});
