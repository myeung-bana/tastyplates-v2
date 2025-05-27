'use client';

import { ApolloProvider } from "@apollo/client";
import client from "@/app/graphql/client";
import { ReactNode } from "react";

interface Props { 
  children: ReactNode;
}

export default function ApolloProviderWrapper({ children }: Props) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}