import Image from "next/image";
import Heading2 from "../common/Heading2";
import SectionCtaButton from "../common/SectionCtaButton";
import styles from "./Reviews.module.css";

export const revalidate = 86400;

type GoogleReview = {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
};

type PlaceDetails = {
  result: {
    rating: number;
    user_ratings_total: number;
    reviews: GoogleReview[];
  };
};

async function fetchReviews(): Promise<PlaceDetails["result"] | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&language=ja&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const data: PlaceDetails = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

function Stars({ rating, size = "md" }: { rating: number; size?: "lg" | "md" }) {
  return (
    <span className={`${styles.stars} ${size === "lg" ? styles.starsLg : ""}`} aria-label={`${rating}点`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={40}
        height={40}
        className={styles.avatar}
        unoptimized
      />
    );
  }
  return (
    <div className={styles.avatarFallback}>
      {name.charAt(0)}
    </div>
  );
}

function relativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}か月前`;
  return `${Math.floor(days / 365)}年前`;
}

function RatingBar({ value, max, count }: { value: number; max: number; count: number }) {
  return (
    <div className={styles.ratingBarRow}>
      <span className={styles.ratingBarLabel}>{value}</span>
      <div className={styles.ratingBarTrack}>
        <div className={styles.ratingBarFill} style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export default async function Reviews() {
  const data = await fetchReviews();

  const ratingCounts = data
    ? data.reviews.reduce((acc: Record<number, number>, r) => {
        acc[r.rating] = (acc[r.rating] ?? 0) + 1;
        return acc;
      }, {})
    : {};
  const maxCount = Math.max(...Object.values(ratingCounts), 1);

  return (
    <section className={styles.section}>
      <div className="inner">
        <Heading2
          title="生徒の声・口コミ・レビュー"
          lead="Y-de-ONEに通う生徒さんのリアルな声・体験談をご紹介します。"
        />

        {data ? (
          <>
            {/* サマリー */}
            <div className={styles.summary}>
              <div className={styles.summaryLeft}>
                <div className={styles.summaryScore}>{data.rating.toFixed(1)}</div>
                <Stars rating={data.rating} size="lg" />
                <div className={styles.summaryTotal}>{data.user_ratings_total}件のクチコミ</div>
              </div>
              <div className={styles.summaryBars}>
                {[5, 4, 3, 2, 1].map((v) => (
                  <RatingBar key={v} value={v} max={maxCount} count={ratingCounts[v] ?? 0} />
                ))}
              </div>
            </div>

            <div className={styles.googleButtons}>
              <a
                href="https://www.google.com/maps/search/?api=1&query_place_id=ChIJVVWByjWNGGARsduqmASnfks"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleButton}
              >
                <GoogleColorIcon />
                すべての口コミを見る
              </a>
              <a
                href="https://g.page/r/CbHbqpgEp35LEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleButton}
              >
                <GoogleColorIcon />
                口コミを書く
              </a>
            </div>

            {/* レビュー一覧 */}
            <ul className={styles.reviewList}>
              {data.reviews.map((review, i) => (
                <li key={i} className={styles.reviewCard}>
                  <div className={styles.cardHeader}>
                    <Avatar name={review.author_name} photoUrl={review.profile_photo_url} />
                    <div className={styles.cardMeta}>
                      <span className={styles.reviewerName}>{review.author_name}</span>
                      <span className={styles.reviewDate}>{relativeDate(review.time)}</span>
                    </div>
                  </div>
                  <div className={styles.cardStars}>
                    <Stars rating={review.rating} />
                  </div>
                  {review.text && (
                    <p className={styles.reviewText}>{review.text}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.fallback}>口コミを読み込めませんでした。</p>
        )}

        <div className={styles.ctaWrap}>
          <SectionCtaButton />
        </div>
      </div>
    </section>
  );
}

function GoogleColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
