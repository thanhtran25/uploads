import axios from 'axios';
import * as https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function fetchFromAPI(url: string) {
  try {
    const response = await axios.get(url, {
      httpsAgent,
      headers: {
        'client-code':
          'LpPuP67Z%dJWwZ2j*HgGWfF!5$2fJorqa4d5d9D&legacy-messages',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    throw error;
  }
}

export async function fetchAPI(url: string, params) {
  try {
    const response = await axios.get(url, {
      httpsAgent,
      ...params,
    });
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
