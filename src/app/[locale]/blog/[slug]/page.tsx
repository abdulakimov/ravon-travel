import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays, ChevronRight, Clock, Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { site } from "@/config/site";
import { getPost, otherPosts, posts } from "@/data/blog";
import { formatDate } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { alternates } from "@/lib/seo";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { PostCard } from "../_components/PostCard";
import styles from "./article.module.css";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

// Faqat ma'lum sluglar — boshqasi 404.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const lc = locale as Locale;
  return {
    title: tr(post.title, lc),
    description: tr(post.excerpt, lc),
    alternates: alternates(locale, `/blog/${post.slug}`),
    openGraph: {
      type: "article",
      title: tr(post.title, lc),
      description: tr(post.excerpt, lc),
      publishedTime: post.date,
      images: [{ url: post.image, alt: tr(post.imageAlt, lc) }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  setRequestLocale(locale);
  const lc = locale as Locale;
  const t = await getTranslations("blog");
  const tc = await getTranslations("common");

  const title = tr(post.title, lc);
  const url = `${site.url}/${locale}/blog/${post.slug}`;
  const organization = { "@type": "Organization", name: site.name, url: site.url };
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: tr(post.excerpt, lc),
    image: `${site.url}${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: locale,
    mainEntityOfPage: url,
    url,
    author: organization,
    publisher: { ...organization, logo: { "@type": "ImageObject", url: `${site.url}/icon.svg` } },
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <article>
        <header className="page-banner">
          <div className={`container container--text page-banner__inner`}>
            <nav className="breadcrumb breadcrumb--light" aria-label={tc("nav.breadcrumb")}>
              <Link href="/">{tc("nav.home")}</Link>
              <Icon icon={ChevronRight} size={13} strokeWidth={2} />
              <Link href="/blog">{t("banner.title")}</Link>
              <Icon icon={ChevronRight} size={13} strokeWidth={2} />
              <span aria-current="page">{title}</span>
            </nav>
            <h1>{title}</h1>
            <div className={styles.meta}>
              <span>
                <Icon icon={CalendarDays} size={14} />
                <time dateTime={post.date}>{formatDate(post.date, lc)}</time>
              </span>
              <span>
                <Icon icon={Clock} size={14} />
                {t("readTime", { count: post.readMinutes })}
              </span>
              <span>{t("author")}</span>
            </div>
          </div>
        </header>

        <div className={`container container--text ${styles.body}`}>
          <div className={styles.hero}>
            <Image
              src={post.image}
              alt={tr(post.imageAlt, lc)}
              fill
              preload
              sizes="(min-width: 860px) 760px, 100vw"
              className={styles.heroImg}
            />
          </div>

          <p className={styles.intro}>{tr(post.intro, lc)}</p>

          <nav className={styles.toc} aria-labelledby="toc-title">
            <h2 id="toc-title" className={styles.tocTitle}>
              {t("toc")}
            </h2>
            <ol>
              {post.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{tr(section.heading, lc)}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={`prose ${styles.content}`}>
            {post.sections.map((section) => (
              <section key={section.id} className={styles.block}>
                <h2 id={section.id}>{tr(section.heading, lc)}</h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{tr(p, lc)}</p>
                ))}
                {section.list && (
                  <ul>
                    {section.list.map((item, i) => (
                      <li key={i}>{tr(item, lc)}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <aside className={`notice notice--info ${styles.notice}`}>
            <Icon icon={Info} size={18} />
            <p>
              {t("notice")}{" "}
              <Link href="/contact" className={styles.noticeLink}>
                {t("noticeLink")}
              </Link>
            </p>
          </aside>
        </div>
      </article>

      <section className={`section section--inner ${styles.more}`} aria-labelledby="more-title">
        <div className="container">
          <Reveal className={styles.moreHead}>
            <h2 id="more-title" className={styles.moreTitle}>
              {t("more")}
            </h2>
            <Link href="/blog" className={`link-arrow ${styles.moreAll}`}>
              {t("all")}
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </Reveal>
          <div className={styles.moreGrid}>
            {otherPosts(post.slug).map((other) => (
              <Reveal key={other.slug}>
                <PostCard post={other} excerpt />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
