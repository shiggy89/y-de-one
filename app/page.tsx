import Header from "./_components/Header";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import Compare from "./_components/Compare";
import Flow from "./_components/Flow";
import About from "./_components/About";
import Access from "./_components/Access";
import Faq from "./_components/Faq";
import Footer from "./_components/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Compare />
        <Flow />
        <About />
        <Access />
        <Faq />
      </main>
      <Footer />
    </>
  );
}