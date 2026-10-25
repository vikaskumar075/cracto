"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";

function getGraphQLUri(): string {
  let uri = process.env.NEXT_PUBLIC_GRAPHQL_URL || "/api/graphql";
  if (uri.startsWith("http")) {
    const trimmed = uri.replace(/\/+$/, "");
    if (!trimmed.endsWith("/graphql") && !trimmed.endsWith("/api/graphql")) {
      uri = `${trimmed}/graphql`;
    }
  }
  return uri;
}

function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: getGraphQLUri(),
      headers: {
        "apollo-require-preflight": "true",
      },
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
