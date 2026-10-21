import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { BlogPost } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { tr } from "@/lib/l10n";
import { Icon } from "@/components/Icon";
import styles from "./PostCard.module.css";

// Blog kartochkasi: 16:10 rasm, sana · o'qish vaqti, H3 (+ ixtiyoriy qisqacha matn).
export function PostCard({
  post,
  excerpt = false,
  heading: Heading = "h3",
}: {
  post: BlogPost;
  excerpt?: boolean;
  heading?: "h2" | "h3";
}) {
  const t = useTranslations("blog");
  const locale = useLocale() as Locale;

  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      <span className={styles.media}>
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 1000px) 400px, (min-width: 640px) 50vw, 100vw"
          className={styles.img}
        />
      </span>
      <span className={styles.meta}>
        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
        <Icon icon={Clock} size={13} />
        <span>{t("readTime", { count: post.readMinutes })}</span>
      </span>
      <Heading className={styles.title}>{tr(post.title, locale)}</Heading>
      {excerpt && <span className={styles.excerpt}>{tr(post.excerpt, locale)}</span>}
    </Link>
  );
}
