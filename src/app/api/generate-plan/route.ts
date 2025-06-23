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

    // 4. Prompt für die KI erstellen
    const prompt = `Erstelle einen detaillierten, tagesbasierten Reiseplan.
      Reiseziel: ${destination}
      Dauer: ${duration} Tage
      Interessen: ${interests}
      
      Gib die Antwort als valides JSON-Objekt aus. Das JSON-Objekt sollte die folgende Struktur haben:
      {
        "planText": "Ein detaillierter, mit Markdown formatierter Reiseplan als String. Jeder Tag sollte eine Überschrift haben (z.B. '# Tag 1: Ankunft').",
        "locations": [
          {
            "name": "Name des Ortes oder der Sehenswürdigkeit",
            "lat": 48.8584,
            "lon": 2.2945
          }
        ]
      }
      
      Extrahiere die Koordinaten (latitude und longitude) für jeden vorgeschlagenen Ort (Sehenswürdigkeit, Restaurant usw.) und füge sie in das 'locations'-Array ein.
      Sei kreativ und versuche, die Interessen bestmöglich zu berücksichtigen. Der 'planText' sollte den gesamten Reiseplan enthalten, wie bisher.`;

    // 5. KI-Modell aufrufen und JSON-Antwort anfordern
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 6. Antwort an den Client senden
    // Der Text ist bereits ein JSON-String, also parsen wir ihn und senden ihn.
    const parsedJson = JSON.parse(text);

    return new Response(JSON.stringify(parsedJson), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Fehler bei der Kommunikation mit der Gemini-API oder beim Parsen der JSON-Antwort.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 