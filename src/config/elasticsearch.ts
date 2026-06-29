import { Client } from "@elastic/elasticsearch";
import { logger } from "../utils/logger.utils";

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  auth: process.env.ELASTICSEARCH_USERNAME
    ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD || "",
      }
    : undefined,
});

export const connectElasticsearch = async (): Promise<void> => {
  try {
    await client.ping();
    logger.info("✅ Elasticsearch connected");
    await createProductIndex();
  } catch (error) {
    logger.error(`❌ Elasticsearch connection failed: ${error}`);
    // Don't crash app — fall back to MongoDB search
  }
};

// Create product index with proper mappings
// Why mappings: tells ES how to index each field — text for full-text, keyword for exact match
const createProductIndex = async (): Promise<void> => {
  const indexExists = await client.indices.exists({ index: "products" });

  if (!indexExists) {
    await client.indices.create({
      index: "products",
      settings: {
        analysis: {
          analyzer: {
            // Custom analyzer — lowercase + remove special chars
            product_analyzer: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "asciifolding"],
            },
          },
        },
      },
      mappings: {
        properties: {
          name: {
            type: "text",
            analyzer: "product_analyzer",
            copy_to: "search_all",
            fields: {
              suggest: {
                type: "completion",
                analyzer: "simple",
              },
            },
          },
          description: {
            type: "text",
            analyzer: "product_analyzer",
            copy_to: "search_all",
          },
          search_all: {
            type: "text",
            analyzer: "product_analyzer",
          },
          category: {
            type: "keyword", // exact match — not analyzed
          },
          tags: {
            type: "keyword",
          },
          price: {
            type: "float",
          },
          stock: {
            type: "integer",
          },
          averageRating: {
            type: "float",
          },
          isActive: {
            type: "boolean",
          },
          createdAt: {
            type: "date",
          },
        },
      },
    });
    logger.info("✅ Elasticsearch products index created");
  }
};

export default client;
