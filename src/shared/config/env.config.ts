export class Config {
  static get SERVER_PORT(): number {
    return parseInt((process.env.SERVER_PORT || 3000) as string);
  }

  static get IDG_EKYC_AUTHORIZATION(): string {
    return process.env.IDG_EKYC_AUTHORIZATION;
  }

  static get IDG_EKYC_TOKEN_ID(): string {
    return process.env.IDG_EKYC_TOKEN_ID;
  }

  static get IDG_EKYC_TOKEN_KEY(): string {
    return process.env.IDG_EKYC_TOKEN_KEY;
  }
}
