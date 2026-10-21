import type { Metadata } from "next";
import { requirePage } from "@/lib/admin/guard";
import { getTourRecords, readDocCopy } from "@/lib/content";
import { PageHead } from "../../_ui/ui";
import { TaxonomyEditor } from "./TaxonomyEditor";

export const metadata: Metadata = { title: "Yo'nalishlar" };

export default async function DestinationsAdmin() {
  await requirePage("admin");
  const [tax, tours] = await Promise.all([readDocCopy("taxonomy"), getTourRecords()]);
  const counts: Record<string, number> = {};
  for (const t of tours) {
    counts[`c:${t.country}`] = (counts[`c:${t.country}`] ?? 0) + 1;
    counts[`k:${t.category}`] = (counts[`k:${t.category}`] ?? 0) + 1;
  }
  return (
    <>
      <PageHead title="Yo'nalishlar" description="Mamlakatlar (yo'nalishlar sahifasi, katalog filtri) va tur toifalari. Tartib — saytdagi tartib." />
      <TaxonomyEditor
        countries={tax.countries.map((c) => ({ id: c.id, name: c.name, image: c.image, home: c.home !== false }))}
        categories={tax.categories.map((k) => ({ id: k.id, name: k.name }))}
        counts={counts}
      />
    </>
  );
}
