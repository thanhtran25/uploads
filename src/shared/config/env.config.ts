export class Config {
  static get PORT(): number {
    return parseInt((process.env.PORT || 3000) as string);
  }
}
