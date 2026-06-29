import { gql } from "graphql-tag";

const authTypeDefs = gql`
  type User {
    _id: ID!
    name: String!
    email: String!
    phone: String!
    role: String!
    isVerified: Boolean!
    createdAt: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type MessageResponse {
    message: String!
  }

  type Query {
    me: User!
  }

  type Mutation {
    sendRegisterOTP(
      name: String!
      email: String!
      password: String!
      phone: String
      captchaToken: String!
    ): MessageResponse!
    verifyRegisterOTP(email: String!, otp: String!): AuthPayload!
    loginWithOTP(email: String!, captchaToken: String!): MessageResponse!
    verifyLoginOTP(email: String!, otp: String!): AuthPayload!
    loginWithPassword(email: String!, password: String!): AuthPayload!
    googleAuth(googleToken: String!): AuthPayload!
    logout: MessageResponse!
    refreshToken: AuthPayload!
    sendForgotPasswordOTP(
      email: String!
      captchaToken: String!
    ): MessageResponse!
    verifyForgotPasswordOTP(email: String!, otp: String!): MessageResponse!
    updatePassword(
      email: String!
      password: String!
      confirmPassword: String!
    ): MessageResponse!
  }
`;

export default authTypeDefs;
