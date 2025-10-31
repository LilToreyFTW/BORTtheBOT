export const metadata = {
  title: "BORT Next",
  description: "Next.js UI for BORTtheBOT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0e14", color: "#e6edf3" }}>{children}</body>
    </html>
  );
}


