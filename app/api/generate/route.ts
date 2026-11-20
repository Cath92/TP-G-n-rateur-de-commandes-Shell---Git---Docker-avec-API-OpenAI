import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialisation du client OpenAI côté serveur
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // 1. Récupération du corps de la requête JSON
    const body = await request.json();
    const { prompt, os } = body;

    // 2. Validation : vérifier que le prompt n'est pas vide
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Le champ "prompt" est requis et ne doit pas être vide.' },
        { status: 400 }
      );
    }

    // 3 & 4. Appel OpenAI avec Structured Outputs (JSON Schema strict)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant expert en administration système ${os ? `pour l'OS ${os}` : ''}. Génère la commande exacte correspondante à la demande de l'utilisateur.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'command_generation_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'La commande exacte sans balises markdown',
              },
              risk: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Niveau de risque associé à l\'exécution de la commande',
              },
              explanation: {
                type: 'string',
                description: 'Explication courte de ce que fait la commande (1 phrase max)',
              },
              warning: {
                type: 'string',
                description: 'Message d\'alerte si risk est medium ou high, sinon chaîne vide',
              },
            },
            required: ['command', 'risk', 'explanation', 'warning'],
            additionalProperties: false,
          },
        },
      },
    });

    const resultText = completion.choices[0].message.content;
    if (!resultText) {
      throw new Error('Réponse vide reçue de l\'API OpenAI.');
    }

    const data = JSON.parse(resultText);

    // Retourne le résultat structuré au format JSON
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Erreur dans /api/generate :', error);

    // 5. Gestion propre des erreurs API
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Clé API OpenAI invalide ou non configurée.' },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Quota OpenAI dépassé ou limite de taux atteinte.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Erreur de l\'API OpenAI.' },
        { status: error.status || 500 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Le corps de la requête n\'est pas un JSON valide.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Une erreur interne est survenue sur le serveur.' },
      { status: 500 }
    );
  }
}