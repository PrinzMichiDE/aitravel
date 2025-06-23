import { getSession } from '@auth0/nextjs-auth0';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

const MONGODB_URI = process.env.MONGODB_URI!;

const planSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  plan: { type: Object, required: true },
});

const Plan = mongoose.models.Plan || mongoose.model('Plan', planSchema);

async function connectMongo() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session || !session.user || !session.user.email) {
    return new Response(JSON.stringify({ error: 'Nicht authentifiziert oder E-Mail fehlt.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await connectMongo();
    const plan = await req.json();
    const userEmail = session.user.email;
    await Plan.findOneAndUpdate(
      { userEmail },
      { plan },
      { upsert: true, new: true }
    );
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