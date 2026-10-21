import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getPosts } from "@/lib/content";
import { alternates } from "@/lib/seo";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { PostCard } from "./_components/PostCard";
import styles from "./blog.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/blog"),
  };
}

// Maqolalar admin paneldan boshqariladi — so'rov vaqtida render.
export const dynamic = "force-dynamic";

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const posts = await getPosts();
  const t = await getTranslations("blog");
  const tc = await getTranslations("common");

  return (
    <>
      <section className="page-banner">
        <div className="container page-banner__inner">
          <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
            <Link href="/">{tc("nav.home")}</Link>
            <Icon icon={ChevronRight} size={13} strokeWidth={2} />
            <span aria-current="page">{t("banner.title")}</span>
          </nav>
          <h1>{t("banner.title")}</h1>
          <p>{t("banner.text")}</p>
        </div>
      </section>

      <section className="section section--inner">
        <div className="container">
          <ul className={styles.grid} aria-label={t("listLabel")}>
            {posts.map((post) => (
              <Reveal as="li" key={post.slug}>
                <PostCard post={post} excerpt heading="h2" />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
