# Intelligenter Reiseführer (AI-Travel)

## Projektvision

Entwicklung einer modernen, KI-gestützten Webanwendung, die Reisenden personalisierte, dynamische und kontextbezogene Reisepläne erstellt. Die Anwendung soll über eine reine Informationsplattform hinausgehen und zu einem proaktiven, interaktiven Reisebegleiter werden, der sich in Echtzeit an die Bedürfnisse des Nutzers anpasst. 

## Authentifizierung

- Auth0 ist als Authentifizierungsprovider integriert (siehe `/pages/api/auth/[...auth0].ts`).
- Die Navbar ist als **Server Component** umgesetzt und zeigt den angemeldeten Nutzer (Name oder E-Mail) sowie Login-/Logout-Buttons abhängig vom Login-Status an. Die Session wird serverseitig mit `getSession()` aus `@auth0/nextjs-auth0/edge` abgefragt.
- Die Startseite und alle Kernfunktionen funktionieren unabhängig vom Login-Status, aber das Speichern/Laden von Plänen ist nur für angemeldete Nutzer möglich. 

## Neue API-Routen: Wetter- und Wikipedia-Integration

### /api/weather

- **Beschreibung:** Liefert aktuelle Wetterdaten für eine Location anhand von Latitude und Longitude (OpenWeatherMap, Deutsch, °C).
- **Methode:** GET
- **Query-Parameter:**
  - `lat` (erforderlich): Breitengrad
  - `lon` (erforderlich): Längengrad
- **Beispiel:**
  ```
  /api/weather?lat=52.52&lon=13.405
  ```
- **Response (Beispiel):**
  ```json
  {
    "weather": [{ "main": "Rain", "description": "mäßiger Regen", "icon": "10d" }],
    "main": { "temp": 18.5, "humidity": 64 },
    "wind": { "speed": 3.6 },
    "name": "Berlin"
  }
  ```
- **Hinweis:** Der OpenWeatherMap-API-Key muss in `.env.local` als `OPENWEATHERMAP_API_KEY` hinterlegt sein. Niemals im Frontend ausliefern!

### /api/wiki

- **Beschreibung:** Liefert eine Wikipedia-Summary (deutsch) für einen gegebenen Titel (z.B. Städtenamen).
- **Methode:** GET
- **Query-Parameter:**
  - `title` (erforderlich): Titel des Wikipedia-Artikels
- **Beispiel:**
  ```
  /api/wiki?title=Berlin
  ```
- **Response (Beispiel):**
  ```json
  {
    "title": "Berlin",
    "extract": "Berlin ist die Hauptstadt der Bundesrepublik Deutschland ...",
    "thumbnail": { "source": "https://..." },
    "content_urls": { "desktop": { "page": "https://de.wikipedia.org/wiki/Berlin" } }
  }
  ```

---

**Sicherheit & Best Practices:**
- Beide Routen sind OWASP- und ESLint-konform implementiert.
- Fehlerhafte oder fehlende Parameter werden mit 400/500-Status beantwortet.
- API-Keys und sensible Daten niemals im Frontend verwenden!

---

**Letzte Änderung:** Wetter- und Wikipedia-API-Routen hinzugefügt (Stand: $(date +%Y-%m-%d)). 

**Events:** API-Route `/api/events` (Eventbrite), Events werden jetzt über einen frei wählbaren Ausgangspunkt (Adresse, optional) und einen Umkreis (km, optional, Standard 30km) gesucht. Wenn kein Ausgangspunkt angegeben ist, wird automatisch "Hauptbahnhof {Reiseziel}" verwendet. Die API nutzt `location.address` und `location.within` gemäß [Eventbrite API Reference – Event Search](https://www.eventbrite.com/platform/api#/reference/event-search). Übernachtungspunkt ist optional für die KI-Planung. 

**Tagesübersicht:** Für jeden Tag wird eine Karte mit allen POIs, Events und Restaurants angezeigt. Die Marker sind mit Icons für Typ (POI, Event, Restaurant) versehen. Events werden tagesgenau geladen und angezeigt. Unter der Karte gibt es Listen für Events, POIs und Restaurants (mit passenden Icons). 