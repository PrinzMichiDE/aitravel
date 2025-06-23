import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  // 1. API-Schlüssel aus den Umgebungsvariablen lesen
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY ist nicht konfiguriert.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 2. Request-Body auslesen
    const { destination, duration, interests } = await req.json();

    if (!destination || !duration || !interests) {
        return new Response(
            JSON.stringify({ error: 'Fehlende Parameter: destination, duration und interests werden benötigt.' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
    }

    // 3. Gemini AI Client initialisieren
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 4. Prompt für die KI erstellen
    const prompt = `Erstelle einen detaillierten, tagesbasierten Reiseplan.
      Reiseziel: ${destination}
      Dauer: ${duration} Tage
      Interessen: ${interests}
      
      Gib die Antwort als reinen Text aus, formatiert mit Markdown.
      Jeder Tag sollte eine Überschrift (z.B. "Tag 1: Ankunft und Erkundung") haben.
      Liste für jeden Tag konkrete Vorschläge für Aktivitäten, Sehenswürdigkeiten und Restaurants auf.
      Gib auch geschätzte Zeiten oder Dauern an, wo es sinnvoll ist.
      Sei kreativ und versuche, die Interessen bestmöglich zu berücksichtigen.`;

    // 5. KI-Modell aufrufen
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 6. Antwort an den Client senden
    return new Response(JSON.stringify({ plan: text }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Fehler bei der Kommunikation mit der Gemini-API.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 