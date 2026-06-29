import { gql } from "graphql-tag";

const addressTypeDefs = gql`
  type Address {
    _id: ID!
    user: User!
    fullName: String!
    phone: String!
    street: String!
    city: String!
    state: String!
    pincode: String!
    country: String!
    isDefault: Boolean!
    label: String!
    createdAt: String!
  }

  input CreateAddressInput {
    fullName: String!
    phone: String!
    street: String!
    city: String!
    state: String!
    pincode: String!
    country: String
    label: String
  }

  input UpdateAddressInput {
    fullName: String
    phone: String
    street: String
    city: String
    state: String
    pincode: String
    country: String
    label: String
  }

  type Query {
    getMyAddresses: [Address!]!
    getAddressById(id: ID!): Address!
  }

  type Mutation {
    createAddress(input: CreateAddressInput!): Address!
    updateAddress(id: ID!, input: UpdateAddressInput!): Address!
    deleteAddress(id: ID!): MessageResponse!
    setDefaultAddress(id: ID!): Address!
  }
`;

export default addressTypeDefs;
