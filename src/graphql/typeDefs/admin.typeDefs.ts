import { gql } from "graphql-tag";

const adminTypeDefs = gql`
  type AuditLog {
    action: String!
    entity: String!
    entityId: String!
    ip: String
    timestamp: String!
  }

  type AdminProfile {
    _id: ID!
    user: User!
    permissions: [String!]!
    isActive: Boolean!
    lastLoginAt: String
    auditLogs: [AuditLog!]!
    createdAt: String!
  }

  type Query {
    getAdminProfile: AdminProfile!
    getAllAdmins: [AdminProfile!]!
    getAuditLogs(adminId: ID!, page: Int, limit: Int): [AuditLog!]!
  }

  type Mutation {
    createAdmin(userId: ID!, permissions: [String!]!): AdminProfile!

    updateAdminPermissions(adminId: ID!, permissions: [String!]!): AdminProfile!

    deactivateAdmin(adminId: ID!): MessageResponse!
  }
`;

export default adminTypeDefs;
