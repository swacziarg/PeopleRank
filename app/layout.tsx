import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PeopleRank",
  description: "A public, satirical app for humorous people ratings."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 sm:px-6">
          <Navbar />
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col pt-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
