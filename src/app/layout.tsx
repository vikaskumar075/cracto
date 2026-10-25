import type { Metadata } from "next";
import "./globals.css";
import { ApolloWrapper } from "@/components/providers/ApolloWrapper";

export const metadata: Metadata = {
  title: "ReleaseCheck — Your all-in-one release checklist tool",
  description: "Manage and track your software release process with structured checklists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
