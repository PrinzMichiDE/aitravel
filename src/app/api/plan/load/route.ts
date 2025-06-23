import { getSession } from '@auth0/nextjs-auth0';
import { adminDb } from '../../../../lib/firebase';

export async function GET() {
  const session = await getSession();

  if (!session || !session.user || !session.user.email) {
    return new Response(JSON.stringify({ error: 'Nicht authentifiziert oder E-Mail fehlt.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userEmail = session.user.email;
    const planDocRef = adminDb.collection('plans').doc(userEmail);
    const docSnap = await planDocRef.get();

    if (docSnap.exists()) {
      return new Response(JSON.stringify(docSnap.data()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Fehler beim Laden des Plans:', error);
    return new Response(JSON.stringify({ error: 'Fehler beim Laden des Plans.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 