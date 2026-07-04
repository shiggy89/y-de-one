import type { Metadata } from "next";
import Hero from "../../_components/sections/class/Hero";
import Reviews from "../../_components/sections/voice/Reviews";

export async function generateMetadata(): Promise<Metadata> {
  let ratingText = "Google高評価";
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${process.env.GOOGLE_PLACE_ID}&fields=rating&key=${process.env.GOOGLE_PLACES_API_KEY}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    if (data.result?.rating) ratingText = `Google評価${data.result.rating}`;
  } catch {}

  return {
    title: "生徒の声・口コミ・体験談 | 大人バレエ教室 Y-de-ONE（ワイデワン）レビュー",
    description: `大人バレエ教室 Y-de-ONE（ワイデワン）の生徒の声・口コミ・体験談。${ratingText}。高田馬場で大人から始めるバレエ・モダンバレエ教室。初心者・50代・60代からも安心して通えると好評です。`,
  };
}

export default function VoicePage() {
  return (
    <>
      <Hero
        title="大人バレエ教室 Y-de-ONE"
        subtitle="生徒の声 -Voice-"
      />
      <Reviews />
    </>
  );
}
