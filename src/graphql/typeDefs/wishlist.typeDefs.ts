import { gql } from "graphql-tag";

const wishlistTypeDefs = gql`
  type Wishlist {
    _id: ID!
    user: User!
    products: [Product!]!
  }

  type Query {
    getMyWishlist: Wishlist
  }

  type Mutation {
    addToWishlist(productId: ID!): Wishlist!
    removeFromWishlist(productId: ID!): Wishlist!
    clearWishlist: MessageResponse!
  }
`;

export default wishlistTypeDefs;
