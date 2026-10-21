import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/admin/guard";
import { getPostRecords } from "@/lib/content";
import { Badge, Empty, PageHead, fmtDate } from "../../_ui/ui";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogAdmin() {
  await requirePage("admin");
  const posts = await getPostRecords();
  return (
    <>
      <PageHead
        title="Blog"
        description="Maqolalar uch tilda. Ruscha/inglizcha bo'sh bo'lsa, saytda o'zbekchasi ko'rsatiladi."
        actions={
          <Link className="btn primary" href="/blog/new">
            + Yangi maqola
          </Link>
        }
      />
      <div className="card table-wrap">
        {posts.length === 0 ? (
          <Empty>Maqola yo&apos;q.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Sarlavha</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.slug}>
                  <td className="nowrap">{fmtDate(p.date)}</td>
                  <td>
                    <Link className="row-link" href={`/blog/${p.slug}`}>
                      {p.title.uz}
                    </Link>
                    <div className="muted mono" style={{ fontSize: 12 }}>
                      {p.slug}
                    </div>
                  </td>
                  <td>{p.published ? <Badge tone="success">E&apos;lon qilingan</Badge> : <Badge>Qoralama</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
