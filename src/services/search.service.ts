import esClient from "../config/elasticsearch";
import { Product } from "../models/Product.model";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.utils";
import { logger } from "../utils/logger.utils";

export const indexProduct = async (productId: string): Promise<void> => {
  try {
    const product = await Product.findById(productId).populate("category");
    if (!product) return;

    await esClient.index({
      index: "products",
      id: productId,
      document: {
        name: product.name,
        description: product.description,
        category: (product.category as any)?.name || "",
        tags: product.tags || [],
        price: product.price,
        stock: product.stock,
        averageRating: product.averageRating,
        isActive: product.isActive,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Failed to index product ${productId}: ${error}`);
  }
};

export const removeProductFromIndex = async (
  productId: string,
): Promise<void> => {
  try {
    await esClient.delete({ index: "products", id: productId });
  } catch (error) {
    logger.error(`Failed to remove product ${productId} from index: ${error}`);
  }
};

export const syncAllProductsToES = async (): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true }).populate(
      "category",
    );
    logger.info(`Syncing ${products.length} products to Elasticsearch...`);

    if (products.length === 0) return;

    const operations = products.flatMap((product) => [
      { index: { _index: "products", _id: product._id.toString() } },
      {
        name: product.name,
        description: product.description,
        category: (product.category as any)?.name || "",
        tags: product.tags || [],
        price: product.price,
        stock: product.stock,
        averageRating: product.averageRating,
        isActive: product.isActive,
        createdAt: product.createdAt,
      },
    ]);

    await esClient.bulk({ operations });
    logger.info("✅ Products synced to Elasticsearch");
  } catch (error) {
    logger.error(`Elasticsearch sync failed: ${error}`);
  }
};

// Main search function
export const searchProductsService = async (args: {
  query: string;
  page?: number;
  limit?: number;
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  };
}) => {
  const { page, limit, skip } = getPaginationParams(args);

  try {
    // Build ES query
    const must: any[] = [
      {
        multi_match: {
          query: args.query,
          fields: ["name^3", "description", "tags^2"],
          // ^3 means name is 3x more important than description
          fuzziness: "AUTO",
          // AUTO fuzziness: allows 1 typo for short words, 2 for long words
          // "niike" → finds "nike", "shirt" → finds "shirts"
        },
      },
      { term: { isActive: true } },
    ];

    const filter: any[] = [];

    if (args.filters?.category) {
      filter.push({ term: { category: args.filters.category } });
    }

    if (args.filters?.minPrice || args.filters?.maxPrice) {
      filter.push({
        range: {
          price: {
            ...(args.filters.minPrice && { gte: args.filters.minPrice }),
            ...(args.filters.maxPrice && { lte: args.filters.maxPrice }),
          },
        },
      });
    }

    if (args.filters?.minRating) {
      filter.push({
        range: { averageRating: { gte: args.filters.minRating } },
      });
    }

    const result = await esClient.search({
      index: "products",
      from: skip,
      size: limit,
      query: {
        bool: { must, filter },
      },
      sort: [
        { _score: { order: "desc" } }, // relevance first
        { averageRating: { order: "desc" } }, // then by rating
      ],
      highlight: {
        // Highlights matching text — useful for frontend to show what matched
        fields: {
          name: {},
          description: { fragment_size: 150 },
        },
      },
    });

    const hits = result.hits.hits;
    const totalCount =
      typeof result.hits.total === "number"
        ? result.hits.total
        : result.hits.total?.value || 0;

    // Fetch full product data from MongoDB using ES result IDs
    // Why: ES stores search data, MongoDB stores full data
    const productIds = hits
      .map((hit) => hit._id)
      .filter((id): id is string => typeof id === "string");

    const products = await Product.find({
      _id: { $in: productIds },
    }).populate("category");

    // Maintain ES relevance order
    const orderedProducts = productIds
      .map((id) => products.find((p) => p._id.toString() === id))
      .filter((p): p is any => Boolean(p));

    return buildPaginatedResult(orderedProducts, totalCount, page, limit);
  } catch (error) {
    // Fallback to MongoDB if ES fails
    logger.error(
      `Elasticsearch search failed, falling back to MongoDB: ${error}`,
    );
    return fallbackSearch(args.query, page, limit);
  }
};

// MongoDB fallback if ES is down
const fallbackSearch = async (query: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    Product.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: "textScore" } },
    )
      .populate("category")
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit),
    Product.countDocuments({ $text: { $search: query }, isActive: true }),
  ]);

  return buildPaginatedResult(data, totalCount, page, limit);
};

export const getSearchSuggestionsService = async (
  query: string,
): Promise<string[]> => {
  try {
    const result = await esClient.search({
      index: "products",
      suggest: {
        product_suggest: {
          prefix: query,
          completion: {
            field: "name.suggest",
            size: 5,
            fuzzy: {
              fuzziness: 1,
            },
          },
        },
      },
    });

    const suggestions =
      (result.suggest as any)?.product_suggest?.[0]?.options?.map(
        (opt: any) => opt.text,
      ) || [];

    return suggestions;
  } catch {
    return [];
  }
};
