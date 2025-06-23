import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);

  if (!session || !session.user) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY ist nicht konfiguriert.' });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const { destination, duration, interests } = req.body;
    if (!destination || !duration || !interests) {
      res.status(400).json({ error: 'Fehlende Parameter: destination, duration und interests werden benötigt.' });
      return;
    }

   const prompt = `Du bist ein erfahrener Reiseplaner. Deine Aufgabe ist es, einen **detaillierten, tagesbasierten Reiseplan** zu erstellen, der perfekt auf die Interessen des Reisenden zugeschnitten ist.

**Reiseziel:** ${destination}
**Dauer:** ${duration} Tage
**Interessen:** ${interests}

**Wichtige Anweisungen für den Reiseplan:**
0. **Achte drauf das die Ziele an den Tagen möglichst nahe beieinander liegen.**
1. **Detaillierung:** Jeder Tag sollte mindestens 3-5 Aktivitäten oder Sehenswürdigkeiten umfassen, inklusive Vorschlägen für Mahlzeiten (Frühstück, Mittagessen, Abendessen), die zu den Interessen passen.
2. **Reisezeit & Logistik:** Berücksichtige realistische Reisezeiten zwischen den Orten.
3. **Anpassung an Interessen:** Integriere die genannten Interessen auf kreative Weise in jede Tagesplanung. Schlage nicht nur offensichtliche, sondern auch einzigartige Erlebnisse vor.
4. **Flexibilität:** Der Plan sollte eine gute Mischung aus Hauptattraktionen und Möglichkeiten zur Entspannung oder freien Zeit bieten.
5. **Ankunft/Abreise:** Plane den ersten und letzten Tag entsprechend als Ankunfts- und Abreisetag.
6. **Sprache:** Der gesamte Reiseplan sollte auf Deutsch verfasst sein.

**Ausgabeformat:**

Gib die Antwort als **valides JSON-Objekt** aus. Das JSON-Objekt sollte die folgende Struktur haben:

\`\`\`json
{
  "planText": "Ein detaillierter, mit Markdown formatierter Reiseplan als String. Jeder Tag sollte eine Überschrift haben (z.B. '# Tag 1: Ankunft in [Stadtname]'), gefolgt von einer detaillierten Beschreibung der Aktivitäten, Essensvorschläge und optionalen Tipps für den jeweiligen Tag.",
  "locations": [
    {
      "name": "Name des Ortes oder der Sehenswürdigkeit",
      "lat": 48.8584,
      "lon": 2.2945
    }
  ]
}
\`\`\``;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    let parsedJson;
    try {
      parsedJson = JSON.parse(text);
      parsedJson.destination = destination;
    } catch (err) {
      return res.status(500).json({ error: 'Fehler beim Parsen der KI-Antwort. Die Antwort war kein valides JSON.', raw: text });
    }

    res.status(200).json(parsedJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fehler bei der Kommunikation mit der Gemini-API oder beim Parsen der JSON-Antwort.' });
  }
} 