import type { Metadata } from "next";
import { requirePage } from "@/lib/admin/guard";
import { readDocCopy } from "@/lib/content";
import { PageHead } from "../../_ui/ui";
import { FaqEditor, type FaqForm } from "./FaqEditor";

export const metadata: Metadata = { title: "Savol-javob" };

export default async function FaqAdmin() {
  await requirePage("admin");
  const doc = await readDocCopy("faq");
  return (
    <>
      <PageHead title="Savol-javob" description="Saytdagi «Savol-javob» sahifasi. Tartib — saytdagi tartib." />
      <FaqEditor initial={doc.items as FaqForm[]} />
    </>
  );
}
