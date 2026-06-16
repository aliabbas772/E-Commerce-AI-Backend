import {
  searchProductsService,
  getSearchSuggestionsService,
} from "../../services/search.service";

const searchResolvers = {
  Query: {
    searchProducts: (_: unknown, args: any) => searchProductsService(args),
    getSearchSuggestions: (_: unknown, args: { query: string }) =>
      getSearchSuggestionsService(args.query),
  },
};

export default searchResolvers;
