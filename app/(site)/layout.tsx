import Header from "../_components/layout/Header/Header";
import Footer from "../_components/layout/Footer/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}