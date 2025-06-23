import { getSession } from '@auth0/nextjs-auth0';
import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);

  if (!session || !session.user || !session.user.email) {
    res.status(401).json({ error: 'Nicht authentifiziert oder E-Mail fehlt.' });
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    await connectMongo();
    const userEmail = session.user.email;
    const planDoc = await Plan.findOne({ userEmail });
    if (planDoc) {
      res.status(200).json(planDoc.plan);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error('Fehler beim Laden des Plans:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Plans.' });
  }
} 