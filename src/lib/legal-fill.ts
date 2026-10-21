import { site } from "@/config/site";
import type { Settings } from "./content";

/** Huquqiy hujjat matnidagi belgilarni admin sozlamalaridagi qiymatlar bilan to'ldiradi. */
export function fillLegal(text: string, settings: Pick<Settings, "legalName" | "email">): string {
  return text.replaceAll("{{company}}", settings.legalName ?? site.name).replaceAll("{{email}}", settings.email);
}
