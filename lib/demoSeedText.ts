// デモの架空データに使う文言（日本語と英語の対訳）。
// データベースには日本語で入れ、英語のデモ（/en から入った場合）では表示するときだけ英語に置き換える。
// データベースは日本語版・英語版で共通なので、データそのものは1種類にしている。

export type Bilingual = { ja: string; en: string };

const b = (ja: string, en: string): Bilingual => ({ ja, en });

// 生徒の名前（name）と LINE の表示名（display）。並びは lib/demoSeed.ts の PEOPLE と同じ。
export const DEMO_PEOPLE_TEXT: { name: Bilingual; display: Bilingual }[] = [
  { name: b("佐藤 美咲", "Emily Carter"), display: b("みさき", "Emily C.") },
  { name: b("鈴木 健太", "Daniel Kim"), display: b("健太", "Daniel") },
  { name: b("高橋 由美子", "Sofia Rossi"), display: b("Yumiko", "Sofia R.") },
  { name: b("田中 翔", "Liam Foster"), display: b("しょう", "Liam") },
  { name: b("伊藤 恵", "Hannah Weber"), display: b("めぐみ🌸", "Hannah W.") },
  { name: b("渡辺 大輔", "Noah Bennett"), display: b("だいすけ", "Noah") },
  { name: b("山本 さくら", "Olivia Martin"), display: b("さくら", "Olivia M.") },
  { name: b("中村 拓也", "Ethan Brooks"), display: b("Takuya", "Ethan") },
  { name: b("小林 真理子", "Grace Nakamura"), display: b("まりこ", "Grace N.") },
  { name: b("加藤 誠", "Lucas Meyer"), display: b("まこと", "Lucas") },
  { name: b("吉田 彩", "Mia Sanchez"), display: b("あや", "Mia S.") },
  { name: b("山田 悠人", "Jack Turner"), display: b("ゆうと", "Jack") },
  { name: b("佐々木 千尋", "Chloe Dubois"), display: b("ちひろ", "Chloe D.") },
  { name: b("デモ管理者", "Demo Admin"), display: b("デモ管理者", "Demo Admin") },
  { name: b("デモ生徒", "Demo Member"), display: b("デモ生徒", "Demo Member") },
  { name: b("松本 理恵", "Ava Thompson"), display: b("りえ", "Ava T.") },
  { name: b("井上 直樹", "Ryan Cooper"), display: b("なおき", "Ryan") },
  { name: b("木村 葵", "Zoe Adams"), display: b("あおい", "Zoe") },
  { name: b("林 陽子", "Oliver Hayes"), display: b("ようこ", "Oliver") },
  { name: b("清水 香織", "Priya Shah"), display: b("かおり", "Priya") },
  { name: b("森 和也", "Marco Bianchi"), display: b("かずや", "Marco") },
];

export const DEMO_GUEST_NAME = b("デモゲスト", "Demo Guest");

export const DEMO_NOTICES_TEXT: { title: Bilingual; body: Bilingual }[] = [
  {
    title: b("Y-de-ONE デモへようこそ", "Welcome to the Y-de-ONE demo"),
    body: b(
      "架空の生徒とサンプルデータで動くデモです。自由に見たり、編集・削除したりしてください。データは毎日リセットされます。",
      "This is a sandbox with fictional students and sample data. Feel free to look around, edit or delete anything. Everything resets every day."
    ),
  },
  {
    title: b("秋のワークショップ 参加者募集中", "Autumn workshop: sign-ups are open"),
    body: b(
      "この秋、どなたでも参加できる1日ワークショップを開催します。参加したい方は、レッスンのあとに先生へお声がけください。",
      "A one-day workshop for all levels will be held this autumn. Ask a teacher after class if you would like to join."
    ),
  },
  {
    title: b("維持費のお支払いについて", "Reminder: monthly studio fee"),
    body: b(
      "月500円の維持費は、その月の最初のレッスンのときに現金でお支払いください。レッスン料は、月に通う回数が多いほど1回あたりが安くなります。",
      "The monthly studio fee of 500 yen is paid in cash at your first lesson of the month. Lesson fees get cheaper the more you attend in a month."
    ),
  },
  {
    title: b("月曜日は休講です", "The studio is closed on Mondays"),
    body: b(
      "通常レッスンは火曜〜日曜です。スケジュールの変更は、ここと教室のホームページでお知らせします。",
      "Regular lessons are held from Tuesday to Sunday. Changes to the schedule are posted here and on the website."
    ),
  },
];

export const DEMO_CATEGORIES_TEXT: Bilingual[] = [b("スタジオ日記", "Studio diary"), b("バレエのコツ", "Ballet tips")];

export const DEMO_POSTS_TEXT: { title: Bilingual; content: Bilingual }[] = [
  {
    title: b("スタジオの静かな火曜日の午後", "A quiet Tuesday afternoon at the studio"),
    content: b(
      "<p>差し込む日差し、温まったバー、少人数のクラス。こんな日があるから、教えるのが好きなんです。</p>",
      "<p>Sunlight, a warm barre and a small class. Days like this are why we teach.</p>"
    ),
  },
  {
    title: b("はじめてのバレエ体験レッスン、ここだけ押さえれば大丈夫", "Five tips for your first ballet class"),
    content: b(
      "<h2>動きやすい服装で</h2><p>体験レッスンは、動きやすい服と靴下があれば大丈夫です。</p><h2>10分前に到着を</h2><p>着替えや先生へのごあいさつに、ゆとりを持ってお越しください。</p>",
      "<h2>Wear what you can move in</h2><p>Comfortable clothes and socks are all you need for a trial lesson.</p><h2>Arrive ten minutes early</h2><p>Take your time to get changed and say hello to your teacher.</p>"
    ),
  },
  {
    title: b("下書き：冬の発表会のアイデア", "Draft: ideas for the winter showcase"),
    content: b("<p>あとで考えるメモ。</p>", "<p>Notes for later.</p>"),
  },
];

export const DEMO_HP_NEWS_TEXT: { title: Bilingual; content: Bilingual }[] = [
  {
    title: b("秋のスケジュールについて", "New autumn schedule"),
    content: b(
      "今月から秋のスケジュールが始まります。\n詳しくはクラスのページをご覧ください。",
      "The autumn schedule starts this month.\nPlease check the class page for details."
    ),
  },
  {
    title: b("体験レッスン受付中です", "Trial lessons are open"),
    content: b(
      "大人の方の体験レッスンを一年中受け付けています。\n体験レッスンのフォームからお申し込みください。",
      "Trial lessons for adults are open all year.\nBook from the trial lesson form."
    ),
  },
  {
    title: b("祝日の休講のお知らせ", "Studio closed for a public holiday"),
    content: b(
      "祝日はスタジオをお休みします。\nご理解のほど、よろしくお願いいたします。",
      "The studio will be closed on the public holiday.\nThank you for your understanding."
    ),
  },
];

export const DEMO_LESSON_INFO_TEXT = {
  change: b("（サンプル）今週の土曜日のレッスンは、30分遅れて始まります。", "Sample notice: the Saturday lesson starts 30 minutes later this week."),
  closed: b("（サンプル）今月の祝日はレッスンがありません。", "Sample notice: no lessons on the public holiday this month."),
};

// 英語デモでの表示用：日本語 → 英語
export const DEMO_DATA_EN: Record<string, string> = Object.fromEntries(
  [
    ...DEMO_PEOPLE_TEXT.flatMap((p) => [p.name, p.display]),
    DEMO_GUEST_NAME,
    ...DEMO_NOTICES_TEXT.flatMap((n) => [n.title, n.body]),
    ...DEMO_CATEGORIES_TEXT,
    ...DEMO_POSTS_TEXT.flatMap((p) => [p.title, p.content]),
    ...DEMO_HP_NEWS_TEXT.flatMap((n) => [n.title, n.content]),
    DEMO_LESSON_INFO_TEXT.change,
    DEMO_LESSON_INFO_TEXT.closed,
  ].map(({ ja, en }) => [ja, en])
);
