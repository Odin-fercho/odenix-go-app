import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Shell HTML estático (web / export). PWA: manifest + metadatos para prompt "Instalar app".
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FFFFFF" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
html,body{background:#FFFFFF;color-scheme:light;margin:0;min-height:100%;color:#1A1A1A;}
#root,body>div{background:#FFFFFF;min-height:100%;}
            `.trim(),
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Odenix Go" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Odenix Go" />
        <meta
          name="description"
          content="Odenix Go: catálogo y pedidos en vivo. Datos desde hub.odenix.shop."
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/pwa-icon-192.png" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
