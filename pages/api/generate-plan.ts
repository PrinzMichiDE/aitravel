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

    const prompt = `Erstelle einen detaillierten, tagesbasierten Reiseplan.\nReiseziel: ${destination}\nDauer: ${duration} Tage\nInteressen: ${interests}\n\nGib die Antwort als valides JSON-Objekt aus. Das JSON-Objekt sollte die folgende Struktur haben:\n{\n  \"planText\": \"Ein detaillierter, mit Markdown formatierter Reiseplan als String. Jeder Tag sollte eine Überschrift haben (z.B. '# Tag 1: Ankunft').\",\n  \"locations\": [\n    {\n      \"name\": \"Name des Ortes oder der Sehenswürdigkeit\",\n      \"lat\": 48.8584,\n      \"lon\": 2.2945\n    }\n  ]\n}\n\nExtrahiere die Koordinaten (latitude und longitude) für jeden vorgeschlagenen Ort (Sehenswürdigkeit, Restaurant usw.) und füge sie in das 'locations'-Array ein.\nSei kreativ und versuche, die Interessen bestmöglich zu berücksichtigen. Der 'planText' sollte den gesamten Reiseplan enthalten, wie bisher.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsedJson = JSON.parse(text);

    res.status(200).json(parsedJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fehler bei der Kommunikation mit der Gemini-API oder beim Parsen der JSON-Antwort.' });
  }
} 