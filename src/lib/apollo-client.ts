"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";

function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}

let client: ApolloClient | null = null;

export function getApolloClient() {
  if (!client) {
    client = createApolloClient();
  }
  return client;
}
