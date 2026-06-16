import { gql } from "graphql-tag";

const reviewTypeDefs = gql`
  type Review {
    _id: ID!
    product: Product!
    user: User!
    rating: Int!
    title: String!
    body: String!
    isVerifiedPurchase: Boolean!
    createdAt: String!
  }

  input CreateReviewInput {
    productId: ID!
    rating: Int!
    title: String!
    body: String!
  }

  input UpdateReviewInput {
    rating: Int
    title: String
    body: String
  }

  type PaginatedReviews {
    data: [Review!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type Query {
    getProductReviews(productId: ID!, page: Int, limit: Int): PaginatedReviews!
    getMyReviews: [Review!]!
  }

  type Mutation {
    createReview(input: CreateReviewInput!): Review!
    updateReview(id: ID!, input: UpdateReviewInput!): Review!
    deleteReview(id: ID!): MessageResponse!
  }
`;

export default reviewTypeDefs;
