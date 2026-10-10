// আগের Geist ফন্ট ইম্পোর্টগুলো রিমোভ করে দিন এবং নিচের মতো সাধারণ স্টাইল রাখুন
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}