/**
 * Version 1.0.0 (Node.js)
 */
const CryptoJS = require("crypto-js");

/** Create a HMAC-SHA256 hash in base64 format **/
function calculateHmac(message, secret) {
    return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Base64);
}

/** Create Hmac required headers (x-date & Proxy-Authorization) */
function generateHmacRequiredHeaders(host, requestTarget, username, secret) {
    const currentDate = new Date("Fri, 12 Dec 2025 09:02:12 GM");
    const sign = calculateHmac(`x-date: ${currentDate}\nhost: ${host}\n${requestTarget}`, secret);

    return {
        'x-sg-v': `hmac username="${username}", algorithm="hmac-sha256", headers="x-date host request-line", signature="${sign}"`,
        'x-date': currentDate
    };
}

function extractDomain(url) {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Main function: generate headers for a request
 * @param {*} options {
 *   hostUrl: 'https://abc.com',
 *   pathPrefix: '/gw',
 *   method: 'GET',
 *   pathWithQuery: '/api/v1/user?id=1',
 *   username: '',
 *   secret: ''
 * }
 */
function createHmacHeaders(options) {
    const { hostUrl, pathPrefix, method, pathWithQuery, username, secret } = options;

    if (!username || !secret || !hostUrl || !pathPrefix) {
        throw new Error("Missing required params");
    }

    const host = extractDomain(hostUrl);
    const requestTarget = `${method} ${pathPrefix + pathWithQuery} HTTP/1.1`;

    return generateHmacRequiredHeaders(host, requestTarget, username, secret);
}

// ===================================================================
// Ví dụ sử dụng
// ===================================================================
const headers = createHmacHeaders({
    hostUrl: "https://api-uat.ikis.kisvn.vn",
    pathPrefix: "/api/v3/e-contract",
    method: "POST",
    pathWithQuery: "phone/card/registrable",
    username: "IITCDki4cm",
    secret: "WEkGb197yf62E32lTDYg4ThY2ay56gPD"
});

console.log(headers);

