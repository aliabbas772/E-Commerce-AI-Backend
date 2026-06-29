import { gql } from "graphql-tag";

const productTypeDefs = gql`
  type Product {
    _id: ID!
    name: String!
    description: String!
    price: Float!
    comparePrice: Float
    images: [String!]!
    category: Category!
    sizes: [String!]!
    stock: Int!
    sku: String
    tags: [String!]
    isActive: Boolean!
    averageRating: Float!
    totalReviews: Int!
    createdAt: String!
  }

  input ProductFilters {
    category: ID
    size: String
    minPrice: Float
    maxPrice: Float
    tags: [String]
    isActive: Boolean
  }

  input CreateProductInput {
    name: String!
    description: String!
    price: Float!
    comparePrice: Float
    images: [String!]
    category: ID!
    sizes: [String!]!
    stock: Int!
    sku: String
    tags: [String]
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    comparePrice: Float
    images: [String]
    category: ID
    sizes: [String]
    stock: Int
    sku: String
    tags: [String]
    isActive: Boolean
  }

  type PaginatedProducts {
    data: [Product!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type Query {
    getProducts(
      filters: ProductFilters
      page: Int
      limit: Int
    ): PaginatedProducts!
    getProductById(id: ID!): Product!
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): MessageResponse!
    uploadProductImage(productId: ID!, base64Image: String!): Product!
  }
`;

export default productTypeDefs;
