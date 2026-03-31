export const metadata = {
  title: "BillCapture",
  description: "Scan vendor bills with AI",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#1A1A2E" />
      </head>
      <body style={{ margin: 0, background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
