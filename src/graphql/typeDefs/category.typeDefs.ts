import { gql } from "graphql-tag";

const categoryTypeDefs = gql`
  type Category {
    _id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    parentCategory: Category
    isActive: Boolean!
    createdAt: String!
  }

  input CreateCategoryInput {
    name: String!
    description: String
    image: String
    parentCategory: ID
  }

  input UpdateCategoryInput {
    name: String
    description: String
    image: String
    parentCategory: ID
    isActive: Boolean
  }

  type Query {
    getCategories: [Category!]!
    getCategoryById(id: ID!): Category!
    getCategoryBySlug(slug: String!): Category!
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): MessageResponse!
  }
`;

export default categoryTypeDefs;
