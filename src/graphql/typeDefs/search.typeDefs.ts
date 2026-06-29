import { gql } from "graphql-tag";

const searchTypeDefs = gql`
  type SearchResult {
    data: [Product!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  input SearchFilters {
    category: String
    minPrice: Float
    maxPrice: Float
    minRating: Float
  }

  type Query {
    searchProducts(
      query: String!
      page: Int
      limit: Int
      filters: SearchFilters
    ): SearchResult!

    getSearchSuggestions(query: String!): [String!]!
  }
`;

export default searchTypeDefs;
