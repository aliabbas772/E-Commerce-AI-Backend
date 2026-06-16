import { gql } from "graphql-tag";

const cartTypeDefs = gql`
  type CartItem {
    product: Product!
    quantity: Int!
    size: String!
    price: Float!
  }

  type Cart {
    _id: ID!
    user: User!
    items: [CartItem!]!
    totalAmount: Float!
    updatedAt: String!
  }

  type Query {
    getMyCart: Cart
  }

  type Mutation {
    addToCart(productId: ID!, quantity: Int!, size: String!): Cart!
    updateCartItem(productId: ID!, quantity: Int!, size: String!): Cart!
    removeFromCart(productId: ID!, size: String!): Cart!
    clearCart: MessageResponse!
  }
`;

export default cartTypeDefs;
