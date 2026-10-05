import { Raleway } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata = {
  title: { default: "Stepozo", template: "%s | Stepozo" },
  description: "Breathable, comfortable shoes for men and women.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={raleway.variable}>
      <body className="bg-white text-ink">
        <Header />
        <main className="max-w-[1980px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
