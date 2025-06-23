import { getSession } from '@auth0/nextjs-auth0';
import { adminDb } from '../../../../lib/firebase';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session || !session.user || !session.user.email) {
    return new Response(JSON.stringify({ error: 'Nicht authentifiziert oder E-Mail fehlt.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const plan = await req.json();

    // Verwende die E-Mail des Benutzers als eindeutige ID für das Dokument.
    const userEmail = session.user.email;
    const planDocRef = adminDb.collection('plans').doc(userEmail);

    await planDocRef.set(plan);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fehler beim Speichern des Plans:', error);
    return new Response(JSON.stringify({ error: 'Fehler beim Speichern des Plans.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 