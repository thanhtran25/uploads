import cors from 'cors';

export class Config {
  static get SERVER_PORT(): number {
    return parseInt((process.env.SERVER_PORT || 3000) as string);
  }

  static get SERVER_SHUTDOWN_TIMEOUT(): number {
    return parseInt((process.env.SERVER_SHUTDOWN_TIMEOUT || 1000) as string);
  }

  static get DB_HOST(): string {
    return process.env.DB_HOST as string;
  }

  static get DB_PORT(): number {
    return parseInt((process.env.DB_PORT || '3000') as string);
  }

  static get DB_USER(): string {
    return process.env.DB_USER as string;
  }

  static get DB_NAME(): string {
    return process.env.DB_NAME as string;
  }

  static get DB_PASSWORD(): string {
    return process.env.DB_PASSWORD as string;
  }

  static get LOGGING(): string {
    return process.env.LOGGING as string;
  }

  static get NODE_ENV(): string {
    return (process.env.NODE_ENV || 'production') as string;
  }

  static get JWT_SECRET_KEY(): string {
    return (process.env.JWT_SECRET_KEY || 'secret') as string;
  }

  static get JWT_EXPIRATION(): number {
    return parseInt((process.env.JWT_EXPIRATION || '90000') as string);
  }

  static get EMAIL_HOST(): string {
    return process.env.EMAIL_HOST || ('smtp.gmail.com' as string);
  }

  static get EMAIL_PORT(): number {
    return parseInt(process.env.EMAIL_PORT || ('587' as string));
  }

  static get EMAIL_SERVICE(): string {
    return process.env.EMAIL_SERVICE || ('gmail' as string);
  }

  static get EMAIL_AUTH_USER(): string {
    return process.env.EMAIL_AUTH_USER || ('example@gmail.com' as string);
  }

  static get EMAIL_AUTH_PASS(): string {
    return process.env.EMAIL_AUTH_PASS || ('123' as string);
  }

  static get WEB_FORGOT_PASSWORD_URL(): string {
    return process.env.WEB_FORGOT_PASSWORD_URL || ('123' as string);
  }

  static get EXPIRED_RESET_PASSWORD_TOKEN(): number {
    return parseInt(
      (process.env.EXPIRED_RESET_PASSWORD_TOKEN || '123') as string,
      10,
    );
  }

  static get ADMIN_EMAIL(): string {
    return process.env.ADMIN_EMAIL || ('123' as string);
  }

  static get ADMIN_PASSWORD(): string {
    return process.env.ADMIN_PASSWORD || ('123' as string);
  }

  static get ADMIN_FULLNAME(): string {
    return (process.env.ADMIN_FULLNAME || '123') as string;
  }

  static get CORS_OPTIONS(): cors.CorsOptions {
    if (process.env.CORS_ORIGIN === '*') {
      return {
        origin: '*',
      };
    }

    const corsOriginList = process.env.CORS_ORIGIN?.split(',');

    if (corsOriginList?.length) {
      return {
        origin: corsOriginList,
      };
    }

    return {
      origin: '*',
    };
  }

  static get COOKIE_ACCESSTOKEN_MAX_AGE(): number {
    return parseInt(
      (process.env.COOKIE_ACCESSTOKEN_MAX_AGE || '123') as string,
      10,
    );
  }

  static get BULLMQ_QUEUES(): string[] {
    const queues = (process.env.BULLMQ_QUEUES || ('' as string)).split('|');
    return queues;
  }

  static get REDIS_HOST(): string {
    return (process.env.REDIS_HOST || 'localhost') as string;
  }

  static get REDIS_PORT(): number {
    return parseInt((process.env.REDIS_PORT || 6379) as string, 10);
  }

  static get REDIS_DB(): number {
    return parseInt((process.env.REDIS_DB || 0) as string, 10);
  }

  static get REDIS_CACHE_URI(): string {
    return (process.env.REDIS_CACHE_URI ||
      'redis://user:pass@localhost:6379') as string;
  }
}
