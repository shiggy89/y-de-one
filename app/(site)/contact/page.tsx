import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ | 大人バレエ教室 Y-de-ONE",
  description: "大人バレエ教室 Y-de-ONE（ワイデワン）へのご質問・ご相談はこちらからお気軽にどうぞ。",
};

export default function Page() {
  return <ContactForm />;
}
