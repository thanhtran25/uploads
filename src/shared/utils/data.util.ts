import fs from 'fs';
import axios from 'axios';

export async function fetchFromAPI(url: string) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    throw error;
  }
}

export function csvToJson(filePath): Record<any, any>[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split lines and remove empty ones
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');

  if (lines.length <= 3) {
    console.error('❌ File does not contain enough data to process!');
    return [];
  }

  // 👉 Skip the first 2 lines and the last line
  const usefulLines = lines.slice(2, -1);

  // Header is on the 2nd line (index 1)
  const headerLine = lines[1];
  const headers = headerLine
    .split(',')
    .map((h) => h.replace(/^"|"$/g, '').trim())
    .filter((h) => h !== '');

  // Parse remaining lines into JSON
  const jsonData = usefulLines.map((line) => {
    const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());

    const obj = {};
    headers.forEach((header, i) => {
      !obj[header] ? (obj[header] = values[i] || '') : 0;
    });

    return obj;
  });

  return jsonData;
}

export function mapData(arrObj: Record<string, any>[], key: string) {
  const resultMap = {};
  arrObj.forEach((obj) => {
    resultMap[obj[key].split(' ')[0]] = obj;
  });
  return resultMap;
}

