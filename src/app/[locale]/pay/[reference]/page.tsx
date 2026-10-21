import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { site } from "@/config/site";
import { BOOKING_ID_RE } from "@/lib/booking-constants";
import { clickConfig } from "@/lib/click";
import { getSettings, getTourAnyState, getTourRecords, publicTour } from "@/lib/content";
import { formatVerifyCode, publicStatus, readOrder, tokenMatches } from "@/lib/orders";
import { qrSvg, verifyUrl } from "@/lib/receipt";
import { ClickPayment, type OrderView, type ReceiptView } from "./ClickPayment";
import { PaymentFlow } from "./PaymentFlow";

type Params = Promise<{ locale: string; reference: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Bron holati har so'rovda serverdan o'qiladi (Click to'lovni istalgan payt tasdiqlashi mumkin).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "payment" });
  return { title: t("meta.title"), robots: { index: false, follow: false } };
}

export default async function PayPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { locale, reference } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!BOOKING_ID_RE.test(reference)) notFound();
  setRequestLocale(locale);

  // Click kalitlari .env da yo'q — demo rejim (bron brauzerda, pul yechilmaydi).
  const click = clickConfig();
  const settings = await getSettings();
  const contact = { email: settings.email, phone: settings.phone };
  if (!click) {
    const tours = (await getTourRecords()).map(publicTour);
    return <PaymentFlow reference={reference} tours={tours} contact={contact} />;
  }

  const query = await searchParams;
  const token = typeof query.k === "string" ? query.k : null;
  const found = await readOrder(reference);
  // Kalitsiz yoki noto'g'ri kalit — "topilmadi" (bron raqamini taxmin qilib ma'lumot olib bo'lmasin).
  const order = found && tokenMatches(found, token) ? found : null;
  const view: OrderView | null = order && {
    status: publicStatus(order),
    amountUzs: order.amountUzs,
    holdUntil: order.holdUntil,
    paidAt: order.paidAt ?? null,
    paydocId: order.transactions.find((t) => t.status === "confirmed")?.clickPaydocId ?? null,
    tourSlug: order.tourSlug,
    departureId: order.departureId,
    adults: order.adults,
    children: order.children,
  };

  // To'langan bo'lsa — chek uchun tekshirish kodi va QR (serverda chiziladi).
  let receipt: ReceiptView | null = null;
  if (order?.status === "paid" && order.verifyCode) {
    const url = verifyUrl(locale, order.id, order.verifyCode);
    receipt = { code: formatVerifyCode(order.verifyCode), url, qrSvg: await qrSvg(url), travelers: order.travelers ?? [] };
  }

  return (
    <ClickPayment
      reference={reference}
      order={view}
      // Maxfiy kalit (secretKey) client'ga HECH QACHON uzatilmaydi — faqat ochiq identifikatorlar.
      click={{ serviceId: click.serviceId, merchantId: click.merchantId, merchantUserId: click.merchantUserId }}
      payToken={order?.payToken ?? null}
      receipt={receipt}
      returnUrl={`${site.url}/${locale}/pay/${reference}?k=${encodeURIComponent(order?.payToken ?? "")}&return=1`}
      returned={query.return === "1"}
      tour={order ? ((await getTourAnyState(order.tourSlug)) ?? null) : null}
      contact={contact}
    />
  );
}
