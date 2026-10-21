import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { requirePage } from "@/lib/admin/guard";
import { listOrders } from "@/lib/admin/orders-admin";
import { getTaxonomy, getTourRecords } from "@/lib/content";
import { todayIso } from "@/lib/tour-utils";
import { ActionForm } from "../../../_ui/ActionForm";
import { emptyL10n } from "../../../_ui/l10n";
import { PageHead } from "../../../_ui/ui";
import { deleteTour, duplicateTour } from "../actions";
import { TourEditor, type TourForm } from "../TourEditor";

export const metadata: Metadata = { title: "Tur" };

const blank = (rank: number): TourForm => ({
  slug: "",
  country: "",
  category: "",
  days: 7,
  nights: 6,
  priceFromUzs: 0,
  fixedDeparture: true,
  top: false,
  rank,
  image: "",
  title: emptyL10n(),
  summary: emptyL10n(),
  published: false,
  departures: [],
  detail: {
    route: emptyL10n(),
    groupSize: { min: 10, max: 18 },
    about: [emptyL10n()],
    gallery: [],
    itinerary: [],
    included: [],
    excluded: [],
    notes: { visa: emptyL10n(), passport: emptyL10n(), cancellation: emptyL10n() },
  },
});

export default async function TourEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("admin");
  const { id } = await params;
  const created = (await searchParams).created === "1";
  const [tours, tax, orders] = await Promise.all([getTourRecords(), getTaxonomy(), listOrders()]);
  const isNew = id === "new";
  const rec = isNew ? undefined : tours.find((t) => t.id === id);
  if (!isNew && !rec) notFound();

  const initial: TourForm = rec
    ? {
        id: rec.id,
        slug: rec.slug,
        country: rec.country,
        category: rec.category,
        days: rec.days,
        nights: rec.nights,
        priceFromUzs: rec.priceFromUzs,
        fixedDeparture: rec.fixedDeparture,
        top: rec.top,
        rank: rec.rank,
        image: rec.image,
        title: rec.title,
        summary: rec.summary,
        published: rec.published,
        departures: rec.departures.map(({ from, to, seatsLeft, priceUzs }) => ({ from, to, seatsLeft, seatsOrig: seatsLeft, priceUzs })),
        detail: rec.detail ?? blank(rec.rank).detail,
      }
    : blank(Math.max(0, ...tours.map((t) => t.rank)) + 1);
  const bookings = rec ? orders.filter((o) => o.tourSlug === rec.slug).length : 0;

  return (
    <>
      <PageHead
        crumbs={[{ href: "/tours", label: "Turlar" }]}
        title={rec ? rec.title.uz : "Yangi tur"}
        description={
          rec ? (
            <>
              {bookings} ta bron ·{" "}
              <a href={`${site.url}/uz/tours/${rec.slug}`} target="_blank" rel="noreferrer">
                saytda ochish
              </a>
            </>
          ) : (
            "To'ldiring va saqlang. «Saytda ko'rinadi» belgilanmaguncha tur saytda chiqmaydi."
          )
        }
        actions={
          rec && (
            <ActionForm action={duplicateTour} submit="Nusxa olish" tone="plain" inline>
              <input type="hidden" name="id" value={rec.id} />
            </ActionForm>
          )
        }
      />
      {created && <p className="alert success">Tur yaratildi.</p>}
      <TourEditor
        initial={initial}
        countries={tax.countryIds.map((cid) => ({ id: cid, name: tax.countries[cid].name.uz }))}
        categories={tax.categoryIds.map((cid) => ({ id: cid, name: tax.categories[cid].name.uz }))}
        today={todayIso()}
        slugLocked={bookings > 0}
      />
      {rec && (
        <details className="card card-pad" style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", fontWeight: 650, color: "var(--danger)" }}>Turni o&apos;chirish</summary>
          <p className="hint">
            {bookings > 0
              ? "Bu turga bronlar bor — o'chirib bo'lmaydi. Uni saytdan yashirish uchun «Saytda ko'rinadi» belgisini olib tashlang."
              : "O'chirilgan turni tiklab bo'lmaydi. Vaqtincha olib tashlash uchun uni yashirish kifoya."}
          </p>
          {bookings === 0 && (
            <ActionForm action={deleteTour} submit="Butunlay o'chirish" tone="danger" confirmText={rec.slug}>
              <input type="hidden" name="id" value={rec.id} />
            </ActionForm>
          )}
        </details>
      )}
    </>
  );
}
