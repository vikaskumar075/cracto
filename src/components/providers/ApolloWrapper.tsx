"use client";

import { ApolloProvider } from "@apollo/client/react";
import { getApolloClient } from "@/lib/apollo-client";

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>
  );
}
