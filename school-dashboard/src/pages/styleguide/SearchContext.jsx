import { createContext, useContext } from "react";

export const SearchContext = createContext({ query: "", visibleIds: null });

export function useSearchContext() {
  return useContext(SearchContext);
}
