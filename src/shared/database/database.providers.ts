import { AppDataSource } from '@shared/connections/database';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      return AppDataSource;
    },
  },
];
