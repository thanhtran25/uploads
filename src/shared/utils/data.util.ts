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
    .map((h) => h.replace(/^"|"$/g, '').trim())
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

export async function postfromAPI(url: string, data: any) {
  try {
    const ipLocation = await axios.get(`https://ipinfo.io/${data}json`);
    // const ipLocation = {
    //   ip: '202.87.212.5', // 👈 IP
    //   city: 'Ho Chi Minh City', // 👈 IP Location 1
    //   region: 'Ho Chi Minh City (HCMC)', // 👈 IP Location 2
    //   country: 'VN', // 👈 IP Location 3
    //   // loc: '10.8230,106.6296',
    //   org: 'AS38249 KIS Viet Nam Securities Corporations',
    //   postal: '71606', // 👈 IP Location 4
    //   timezone: 'Asia/Ho_Chi_Minh',
    //   readme: 'https://ipinfo.io/missingauth',
    // };
    console.log(ipLocation);
    
    // const response = await axios.post(
    //   url,
    //   {
    //     phone: '0773104603',
    //     refId: '69ae626b-20bc-427d-957a-4b622cc12e93',
    //     otp: data,
    //   },
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Aff-Ref-Id': 'Aff-Ref-Id-test',
    //       'X-Ip-Location': JSON.stringify(ipLocation.data),
    //     },
    //   },
    // );
    return ipLocation.data;
  } catch (error) {
    console.error('❌ API Error:', error.message);
    throw error;
  }
}
