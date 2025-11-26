import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// nunito regular 400   
const nunito = Nunito({
    subsets: ['latin'],
    display: 'swap',
    weight: ["600"]
});

export const metadata: Metadata = {
  title: "Cad AI",
  description: "AI-powered CAD design assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body className={nunito.className + ' antialiased'}>
        {children}
      </body>
    </html>
  );
}
