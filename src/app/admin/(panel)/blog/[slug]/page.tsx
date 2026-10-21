import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { requirePage } from "@/lib/admin/guard";
import { getPostRecords } from "@/lib/content";
import { todayIso } from "@/lib/tour-utils";
import { ActionForm } from "../../../_ui/ActionForm";
import { emptyL10n } from "../../../_ui/l10n";
import { PageHead } from "../../../_ui/ui";
import { deletePost } from "../actions";
import { PostEditor, type PostForm } from "../PostEditor";

export const metadata: Metadata = { title: "Maqola" };

export default async function PostEdit({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("admin");
  const { slug } = await params;
  const saved = (await searchParams).saved === "1";
  const isNew = slug === "new";
  const rec = isNew ? undefined : (await getPostRecords()).find((p) => p.slug === slug);
  if (!isNew && !rec) notFound();
  const initial: PostForm = rec
    ? {
        originalSlug: rec.slug,
        slug: rec.slug,
        date: rec.date,
        readMinutes: rec.readMinutes,
        image: rec.image,
        imageAlt: rec.imageAlt,
        title: rec.title,
        excerpt: rec.excerpt,
        intro: rec.intro,
        sections: rec.sections,
        published: rec.published,
      }
    : {
        slug: "",
        date: todayIso(),
        readMinutes: 4,
        image: "",
        imageAlt: emptyL10n(),
        title: emptyL10n(),
        excerpt: emptyL10n(),
        intro: emptyL10n(),
        sections: [{ id: "bolim-1", heading: emptyL10n(), paragraphs: [emptyL10n()] }],
        published: false,
      };
  return (
    <>
      <PageHead
        crumbs={[{ href: "/blog", label: "Blog" }]}
        title={rec ? rec.title.uz : "Yangi maqola"}
        description={
          rec?.published ? (
            <a href={`${site.url}/uz/blog/${rec.slug}`} target="_blank" rel="noreferrer">
              saytda ochish
            </a>
          ) : (
            "Qoralama — «Saytda e'lon qilingan» belgilanmaguncha saytda ko'rinmaydi."
          )
        }
      />
      {saved && <p className="alert success">Saqlandi.</p>}
      <PostEditor key={rec?.slug ?? "new"} initial={initial} />
      {rec && (
        <details className="card card-pad" style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", fontWeight: 650, color: "var(--danger)" }}>Maqolani o&apos;chirish</summary>
          <ActionForm action={deletePost} submit="Butunlay o'chirish" tone="danger" confirmText={rec.slug}>
            <input type="hidden" name="slug" value={rec.slug} />
          </ActionForm>
        </details>
      )}
    </>
  );
}
