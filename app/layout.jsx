import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

export const metadata = {
  title: "Whop API Tester",
  description: "Test harness for Whop payment and account management APIs",
};

// Inline script runs before React hydration to apply the saved theme
// immediately, preventing a flash of the wrong theme on load.
const themeInitScript = `
  try {
    var t = localStorage.getItem('whop-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
