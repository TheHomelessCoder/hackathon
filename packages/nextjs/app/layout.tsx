import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import { JetBrains_Mono } from "next/font/google";

export const metadata = getMetadata({
  title: "Steal My Idea | Proof on Polkadot",
  description: "Here's my idea. If you build it, I have proof I published it first. Powered by Polkadot.",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning data-theme="hacker" className={jetbrainsMono.className}>
      <body>
        <ThemeProvider defaultTheme="hacker" forcedTheme="hacker">
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
