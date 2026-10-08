import { setRequestLocale } from "next-intl/server";
import { toursByRank } from "@/data/tours";
import { TourCard } from "@/components/TourCard";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container section">
      <div className="card-grid">
        {toursByRank.slice(0, 6).map((t) => (
          <TourCard key={t.id} tour={t} />
        ))}
      </div>
    </div>
  );
}
