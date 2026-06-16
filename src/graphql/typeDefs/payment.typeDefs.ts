import { gql } from "graphql-tag";

const paymentTypeDefs = gql`
  type Payment {
    _id: ID!
    order: Order!
    user: User!
    amount: Float!
    currency: String!
    status: String!
    gateway: String!
    gatewayOrderId: String!
    gatewayPaymentId: String
    method: String
    bank: String
    refundId: String
    refundAmount: Float
    refundReason: String
    refundedAt: String
    failureReason: String
    createdAt: String!
  }

  type Query {
    getMyPayments: [Payment!]!
    getPaymentByOrderId(orderId: ID!): Payment
    getAllPayments(page: Int, limit: Int): [Payment!]!
  }

  type Mutation {
    initiateRefund(paymentId: ID!, amount: Float!, reason: String!): Payment!
  }
`;

export default paymentTypeDefs;
