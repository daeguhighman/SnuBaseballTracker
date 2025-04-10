import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@teams/(.*)$': '<rootDir>/../src/teams/$1',
    '^@players/(.*)$': '<rootDir>/../src/players/$1',
    '^@users/(.*)$': '<rootDir>/../src/users/$1',
  },
};

export default config;
