import { cache } from "react";
import { notFound } from "next/navigation";
import { gql, PRODUCT_FIELDS } from "@/lib/magento";
import ProductView from "@/components/product/product-view";
import ProductGrid from "@/components/product-grid";
import SectionHeading from "@/components/section-heading";

const MONEY = "value currency";
const MIN_PRICE = `minimum_price { final_price { ${MONEY} } regular_price { ${MONEY} } }`;
const MEDIA = "media_gallery { url label position disabled }";

const PRODUCT = `query ($urlKey: String!) {
  products(filter: { url_key: { eq: $urlKey } }) {
    items {
      __typename uid sku name url_key stock_status meta_title meta_description
      description { html }
      short_description { html }
      ${MEDIA}
      price_range { ${MIN_PRICE} maximum_price { final_price { ${MONEY} } } }
      related_products { ${PRODUCT_FIELDS} }
      ... on ConfigurableProduct {
        configurable_options {
          uid attribute_code label position
          values { uid label swatch_data { __typename value ... on ImageSwatchData { thumbnail } } }
        }
        variants {
          attributes { code uid }
          product { sku stock_status ${MEDIA} price_range { ${MIN_PRICE} } }
        }
      }
      ... on BundleProduct {
        dynamic_price
        items {
          uid title type required position
          options {
            uid label quantity is_default can_change_quantity price price_type
            product { stock_status price_range { minimum_price { final_price { ${MONEY} } } } }
          }
        }
      }
      ... on GroupedProduct {
        items {
          qty position
          product {
            sku name stock_status small_image { url label }
            price_range { minimum_price { final_price { ${MONEY} } } }
          }
        }
      }
      ... on DownloadableProduct {
        links_title links_purchased_separately
        downloadable_product_links { uid title price sample_url sort_order }
        downloadable_product_samples { title sample_url sort_order }
      }
    }
  }
}`;

// Deduped across generateMetadata and the page within one request.
const getProduct = cache(async (urlKey) => {
  const { products } = await gql(PRODUCT, { urlKey });
  return products.items[0] ?? notFound();
});

export async function generateMetadata({ params }) {
  const product = await getProduct((await params).urlKey);
  return {
    title: product.meta_title || product.name,
    description: product.meta_description || undefined,
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct((await params).urlKey);
  const related = product.related_products?.filter((p) => p.small_image) ?? [];

  return (
    <>
      <section className="px-5 py-10 md:px-[50px] md:py-[60px]">
        <ProductView product={product} />
      </section>

      {product.description?.html && (
        <section className="px-5 md:px-[50px]">
          <h2 className="mb-4 border-b border-line pb-2 text-2xl font-semibold">Details</h2>
          {/* Admin-authored HTML from Magento. */}
          <div
            className="max-w-3xl text-ink [&_a]:underline [&_li]:mb-1 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: product.description.html }}
          />
        </section>
      )}

      {related.length > 0 && (
        <section className="container py-10 text-center md:py-[60px]">
          <SectionHeading>Related products</SectionHeading>
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}
    </>
  );
}
