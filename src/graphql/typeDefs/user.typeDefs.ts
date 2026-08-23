import { gql } from "graphql-tag";

const userTypeDefs = gql`
  type PaginatedUsers {
    data: [User!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type Query {
    getAllUsers(search: String, page: Int, limit: Int): PaginatedUsers!
  }
`;

export default userTypeDefs;
