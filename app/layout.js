import "./globals.css";
import { COMPANY_NAME, EVENT_NAME } from "../lib/config";
import ParallaxBackground from "../components/ParallaxBackground";

export const metadata = {
  title: `${EVENT_NAME} | ${COMPANY_NAME}`,
  description: `${COMPANY_NAME}'s Onam + 14th-anniversary team mini-game event`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ParallaxBackground />
        {children}
      </body>
    </html>
  );
}
