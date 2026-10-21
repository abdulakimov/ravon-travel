"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { audit } from "@/lib/admin/audit";
import { UserError } from "@/lib/admin/errors";
import { requireAction } from "@/lib/admin/guard";
import { postSchema } from "@/lib/admin/schemas";
import { updateDoc } from "@/lib/content";

export async function savePost(_p: ActionState, form: FormData): Promise<ActionState> {
  let goTo: string | null = null;
  try {
    const user = await requireAction("admin");
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("payload") ?? ""));
    } catch {
      throw new UserError("Forma ma'lumoti o'qilmadi.");
    }
    const { originalSlug, ...post } = postSchema.parse(raw);
    const sectionIds = post.sections.map((s) => s.id);
    if (new Set(sectionIds).size !== sectionIds.length) throw new UserError("Bo'lim ID'lari takrorlanmasin.");
    await updateDoc("posts", (doc) => {
      if (doc.posts.some((p) => p.slug === post.slug && p.slug !== originalSlug)) throw new UserError("Bu slug boshqa maqolada band.");
      const rec = { ...post, sections: post.sections.map((s) => ({ ...s, list: s.list?.length ? s.list : undefined })), updatedAt: new Date().toISOString() };
      if (originalSlug) {
        const i = doc.posts.findIndex((p) => p.slug === originalSlug);
        if (i < 0) throw new UserError("Maqola topilmadi.");
        doc.posts[i] = rec;
      } else doc.posts.push(rec);
    });
    await audit(user, originalSlug ? "post_update" : "post_create", post.slug);
    if (!originalSlug || originalSlug !== post.slug) goTo = `/blog/${post.slug}?saved=1`;
    else {
      refresh();
      return { ok: "Saqlandi." };
    }
  } catch (err) {
    return failure(err, "savePost");
  }
  redirect(goTo);
}

export async function deletePost(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await requireAction("admin");
    const slug = String(form.get("slug") ?? "");
    if (form.get("confirm") !== slug) throw new UserError("Tasdiqlash uchun slugni aynan yozing.");
    await updateDoc("posts", (doc) => {
      if (!doc.posts.some((p) => p.slug === slug)) throw new UserError("Maqola topilmadi.");
      doc.posts = doc.posts.filter((p) => p.slug !== slug);
    });
    await audit(user, "post_delete", slug);
  } catch (err) {
    return failure(err, "deletePost");
  }
  redirect("/blog");
}
