# Intelligenter Reiseführer (AI-Travel)

## Projektvision

Entwicklung einer modernen, KI-gestützten Webanwendung, die Reisenden personalisierte, dynamische und kontextbezogene Reisepläne erstellt. Die Anwendung soll über eine reine Informationsplattform hinausgehen und zu einem proaktiven, interaktiven Reisebegleiter werden, der sich in Echtzeit an die Bedürfnisse des Nutzers anpasst. 

## Authentifizierung

- Auth0 ist als Authentifizierungsprovider integriert (siehe `/pages/api/auth/[...auth0].ts`).
- Die Navbar ist als **Server Component** umgesetzt und zeigt den angemeldeten Nutzer (Name oder E-Mail) sowie Login-/Logout-Buttons abhängig vom Login-Status an. Die Session wird serverseitig mit `getSession()` aus `@auth0/nextjs-auth0/edge` abgefragt.
- Die Startseite und alle Kernfunktionen funktionieren unabhängig vom Login-Status, aber das Speichern/Laden von Plänen ist nur für angemeldete Nutzer möglich. 