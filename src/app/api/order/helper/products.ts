import { getPayload, CollectionSlug } from 'payload'
import config from '@payload-config'
import type { CartDetails } from "../interfaces";

const payload = await getPayload({ config });

export async function getProductDocs(
  cartDetails: CartDetails
): Promise<any[]> {
  // Group product IDs by their collection names
  const idsByCollection: Record<string, string[]> = {};
  cartDetails.items?.flatMap(item => {
    const collectionName = item.collectionName || "";
    if (!idsByCollection[collectionName]) idsByCollection[collectionName] = [];
    idsByCollection[collectionName].push(item.id);
  });

  // Fetch details for each collection in parallel
  const fetchPromises = Object.entries(idsByCollection).map(
    async ([collection, ids]) => {
      const result = await payload.find({
        collection: collection as CollectionSlug,
        where: { id: { in: ids } },
        limit: ids.length,
      });
      return { collection, docs: result.docs };
    }
  );
  const docsArrays = await Promise.all(fetchPromises);

  // Build lookup map: { collection: { id: doc } }
  const productMap: any[] = [];
  docsArrays.flatMap(colDocs => {
    colDocs.docs.flatMap(doc => {
      productMap.push(doc);
    });
  });

  return productMap;
}

export function calculateTotalPrice(products: any[]): number {
  return products.reduce((total, doc) => {
    const price = typeof doc.markup_price === 'number'
      ? doc.markup_price
      : Number(doc.markup_price) || 0;
    return total + price;
  }, 0);
}

/**
 * Finds and returns a product document by its ID.
 * @param productDocs - array of product documents
 * @param id - the ID to search for
 * @returns the matching product doc or undefined if not found
 */
export function getProductById(productDocs: any[], id: string): any | undefined {
  return productDocs.find(doc => doc.id === id);
}

/**
 * Filters product documents to only those matching given IDs.
 * @param productDocs - array of product documents
 * @param ids - array of IDs to filter by
 * @returns array of matching product docs
 */
export function getProductsByIds(productDocs: any[], ids: string[]): any[] {
  return productDocs.filter(doc => ids.includes(doc.id));
}

/**
 * Gets the price of a product by its ID.
 * @param productDocs - array of product documents
 * @param id - the ID of the product
 * @returns the product price as a number, or undefined if not found
 */
export function getProductPriceById(
  productDocs: any[],
  id: string
): number {
  const product = getProductById(productDocs, id);
  if (!product) return 0;
  return product.price;
}