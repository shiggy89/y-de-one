import Header from "../_components/layout/Header/Header";
import Footer from "../_components/layout/Footer/Footer";
import LiffAuthInit from "../_components/LiffAuthInit";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LiffAuthInit />
      <Header />
      {children}
      <Footer />
    </>
  );
}