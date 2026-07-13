import './globals.css'

export const metadata = {
  title: 'FERREPOINT',
  description: 'Sistema POS para ferreterías',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
