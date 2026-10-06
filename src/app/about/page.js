import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "About us" };

export default function About() {
  return (
    <section className="px-5 py-10 md:px-[50px] md:py-[60px]">
      <Breadcrumbs items={[{ label: "About us" }]} />
      <h1 className="text-3xl md:text-4xl">About us</h1>
    </section>
  );
}
