import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavigationWrapper } from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "RaceBase — 陸上競技情報システム",
  description: "マラソン・中長距離選手の記録管理と観戦サポート",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <NavigationWrapper />
          <main
            style={{
              minHeight: "calc(100vh - 44px)",
              background: "var(--color-background-tertiary)",
              padding: "1.1rem",
            }}
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
