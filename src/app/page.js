import Image from "next/image";
import { gql, PRODUCT_FIELDS } from "@/lib/magento";
import ProductGrid from "@/components/product-grid";
import SectionHeading from "@/components/section-heading";
import CategoryFilter from "@/components/category-filter";
import PillLink from "@/components/pill-link";
import Icon from "@/components/icon";

// ponytail: Magento CE has no bestseller query; shows first 4 catalog products. Swap for a "bestsellers" category when one exists.
const BESTSELLERS = `{
  products(search: "", pageSize: 4) {
    items { ${PRODUCT_FIELDS} }
  }
}`;

const GENDERS = [
  { title: "For Women", cta: "Shop women", href: "/category/women", image: "/images/women.png" },
  { title: "For Men", cta: "Shop men", href: "/category/men", image: "/images/men.jpg" },
];

// Static showcase tiles from the design; `tags` drive the filter pills.
const CATEGORY_FILTERS = ["Sneakers", "Boots", "Formal", "Sports shoe", "Loafers", "Snow Boots"];
const USD59 = { value: 59, currency: "USD" };
const CATEGORY_TILES = [
  { name: "Sneakers", image: "/images/sneakers.png", tags: ["Sneakers"] },
  { name: "Leather Boots", image: "/images/leather.png", tags: ["Boots"] },
  { name: "Snow Boots", image: "/images/snow.png", tags: ["Boots", "Snow Boots"] },
  { name: "Running shoes", image: "/images/running.png", tags: ["Sneakers", "Sports shoe"] },
  { name: "Loafers", image: "/images/loafers.png", tags: ["Loafers", "Formal"] },
  { name: "Oxfords shoes", image: "/images/oxfords.png", tags: ["Formal"] },
  { name: "Sports shoe", image: "/images/sports.png", tags: ["Sports shoe", "Sneakers"] },
  { name: "Formal shoes", image: "/images/formal.png", tags: ["Formal"] },
].map((t) => ({ ...t, price: USD59 }));

const FEATURES = [
  { icon: "truck", title: "Free Delivery", text: "Free shipping on all orders" },
  { icon: "returns", title: "Easy return policy", text: "14 Days Easy Return" },
  { icon: "support", title: "24/7 Support", text: "Support online 24 hours a day" },
];

export default async function Home() {
  const { products: { items: products } } = await gql(BESTSELLERS);

  return (
    <>
      <section className="relative bg-surface">
        <div className="container py-10 lg:absolute lg:inset-0 lg:flex lg:items-center lg:py-0">
          <div className="lg:w-[40%] xl:w-[34%]">
            <h1 className="mb-4 text-3xl font-semibold leading-tight text-black md:text-4xl xl:text-[2.75rem]">
              Step into greatness with Stepozo.
            </h1>
            <p className="mb-8 text-sm text-ink">
              Experience the freedom of breathable, comfortable shoes designed to take you anywhere
              you want to go, where comfort meets confidence.
            </p>
            <PillLink href="/category/what-is-new">Explore now</PillLink>
          </div>
        </div>
        <Image src="/Banner.png" alt="" width={1920} height={814} priority sizes="100vw" className="h-auto w-full" />
      </section>

      <section className="container py-16 md:py-[90px]">
        <SectionHeading>Our Bestsellers</SectionHeading>
        <ProductGrid products={products} />
      </section>

      <section className="grid md:grid-cols-2">
        {GENDERS.map(({ title, cta, href, image }) => (
          <div key={href} className="relative h-[380px] overflow-hidden md:h-[500px] xl:h-[627px]">
            <Image src={image} fill alt="" sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
            <div className="absolute inset-x-5 bottom-8 flex items-center justify-between gap-4 md:inset-x-10 xl:bottom-14 xl:left-[110px] xl:right-[60px]">
              <h3 className="text-3xl font-semibold text-white md:text-4xl xl:text-5xl">{title}</h3>
              <PillLink href={href} className="text-xs">{cta}</PillLink>
            </div>
          </div>
        ))}
      </section>

      <section className="container py-16 md:py-[90px]">
        <SectionHeading>Shop by Category</SectionHeading>
        <CategoryFilter filters={CATEGORY_FILTERS} tiles={CATEGORY_TILES} />
      </section>

      <section className="container grid gap-8 pb-16 sm:grid-cols-3 md:pb-[90px]">
        {FEATURES.map(({ icon, title, text }) => (
          <div key={title} className="flex items-center gap-4 sm:justify-center">
            <Icon name={icon} className="size-12 shrink-0 text-black" />
            <div>
              <h3 className="text-lg font-semibold text-black">{title}</h3>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <Image src="/images/promo.png" alt="Casual sport shoes, 50% off" width={1920} height={800} sizes="100vw" className="h-auto w-full" />
      </section>
    </>
  );
}
