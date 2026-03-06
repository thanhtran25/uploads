import fs from 'fs';
import axios from 'axios';
function toPlainHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') return {};

  const source =
    'toJSON' in headers && typeof headers.toJSON === 'function'
      ? headers.toJSON()
      : headers;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    source as Record<string, unknown>,
  )) {
    if (value === undefined) continue;
    result[key] = String(value);
  }
  return result;
}

function buildRequestSnapshot(config: any, fallbackUrl: string) {
  return {
    method: (config?.method ?? 'GET').toUpperCase(),
    url: config?.url ?? fallbackUrl,
    headers: toPlainHeaders(config?.headers),
    params: config?.params ?? null,
    data: config?.data ?? null,
  };
}

export async function fetchFromAPI(url: string) {
  try {
    const response = await axios.get(url);
    const requestSnapshot = buildRequestSnapshot(response.config, url);
    console.log(
      '✅ API Request:',
      JSON.stringify({
        ...requestSnapshot,
        status: response.status,
        responseHeaders: toPlainHeaders(response.headers),
      }, null, 2),
    );
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    throw error;
  }
}

function parseCsvContent(content: string): Record<string, any>[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');

  if (lines.length <= 3) {
    console.error('❌ File does not contain enough data to process!');
    return [];
  }

  const usefulLines = lines.slice(2, -1);
  const headerLine = lines[1];
  const headers = headerLine
    .split(',')
    .map((h) => h.replace(  /^"|"$/g, '').trim())
    .filter((h) => h !== '');

  const jsonData = usefulLines.map((line) => {
    const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
    const obj: Record<string, any> = {};
    headers.forEach((header, i) => {
      if (!obj[header]) obj[header] = values[i] || '';
    });
    return obj;
  });

  return jsonData;
}

export function csvToJson(filePath: string): Record<string, any>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseCsvContent(content);
}

/**
 * Parse CSV from buffer or string (e.g. uploaded file).
 * Use for API receiving file list.
 */
export function csvToJsonFromContent(
  content: Buffer | string,
): Record<string, any>[] {
  const str = Buffer.isBuffer(content) ? content.toString('utf-8') : content;
  return parseCsvContent(str);
}

export function mapData(arrObj: Record<string, any>[], key: string) {
  const resultMap = {};
  arrObj.forEach((obj) => {
    resultMap[obj[key].split(' ')[0]] = obj;
  });
  return resultMap;
}
