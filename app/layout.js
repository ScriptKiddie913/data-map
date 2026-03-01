import "./globals.css"

export const metadata = {
  title: "CYBER LEAK MONITOR",
  description: "Secure data intelligence terminal",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
