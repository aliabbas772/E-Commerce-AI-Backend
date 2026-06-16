import { gql } from 'graphql-tag'

const aiTypeDefs = gql`
  type AIRecommendation {
    recommendation: String!
  }

  type Query {
    getOutfitRecommendation(
      occasion: String!
      budget: Float!
      gender: String!
    ): AIRecommendation!

    getSizeRecommendation(
      height: Float!
      weight: Float!
      gender: String!
      category: String!
    ): AIRecommendation!
  }
`

export default aiTypeDefs