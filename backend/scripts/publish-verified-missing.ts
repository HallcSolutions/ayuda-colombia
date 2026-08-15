import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface VerifiedMissingInput {
  name: string;
  [key: string]: unknown;
}

const argument = (name: string): string => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? '') : '';
};

async function main(): Promise<void> {
  const file = argument('--file');
  const endpoint =
    argument('--url') || 'https://redayudacolombia.com/api/missing/verified';
  const publisherKey = process.env.MISSING_PUBLISHER_KEY?.trim();
  if (!file) throw new Error('Falta --file con un arreglo JSON de avisos');
  if (!publisherKey)
    throw new Error('MISSING_PUBLISHER_KEY no está configurada');

  const payload = JSON.parse(
    await readFile(resolve(file), 'utf8'),
  ) as VerifiedMissingInput[];
  if (!Array.isArray(payload))
    throw new Error('El archivo debe ser un arreglo');

  for (const item of payload) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-missing-publisher-key': publisherKey,
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error(
        `No se pudo publicar ${item.name}: ${response.status} ${await response.text()}`,
      );
    }
    console.log(`Publicado o refrescado: ${item.name}`);
  }
}

void main();
