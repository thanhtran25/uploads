export class Config {
  static get SERVER_PORT(): number {
    return parseInt((process.env.SERVER_PORT || 3000) as string);
  }
}
