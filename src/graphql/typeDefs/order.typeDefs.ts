import { gql } from "graphql-tag";

const orderTypeDefs = gql`
  type OrderItem {
    product: Product!
    quantity: Int!
    price: Float!
    size: String!
  }

  type Order {
    _id: ID!
    user: User!
    items: [OrderItem!]!
    totalAmount: Float!
    discount: Float
    couponCode: String
    paymentStatus: String!
    deliveryStatus: String!
    address: Address!
    payment: Payment
    notes: String
    createdAt: String!
  }

  type SalesAnalytics {
    totalRevenue: Float!
    totalOrders: Int!
    averageOrderValue: Float!
  }

  type TopProduct {
    productId: String!
    name: String!
    totalSold: Int!
    revenue: Float!
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    size: String!
  }

  type RazorpayOrder {
    razorpayOrderId: String!
    amount: Int!
    currency: String!
  }

  type PaginatedOrders {
    data: [Order!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type Query {
    getMyOrders(page: Int, limit: Int): PaginatedOrders!
    getAllOrders(page: Int, limit: Int): PaginatedOrders!
    getOrderById(id: ID!): Order!
    getSalesAnalytics: SalesAnalytics!
    getTopProducts: [TopProduct!]!
  }

  type Mutation {
    createOrder(
      items: [OrderItemInput!]!
      addressId: ID!
      notes: String
    ): RazorpayOrder!

    verifyPayment(
      razorpayOrderId: String!
      razorpayPaymentId: String!
      razorpaySignature: String!
    ): MessageResponse!

    updateOrderStatus(id: ID!, deliveryStatus: String!): Order!
    cancelOrder(id: ID!, reason: String): MessageResponse!
  }
`;

export default orderTypeDefs;
