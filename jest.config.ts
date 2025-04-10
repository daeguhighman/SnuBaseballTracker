import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@teams/(.*)$': '<rootDir>/src/teams/$1',
    '^@players/(.*)$': '<rootDir>/src/players/$1',
    '^@users/(.*)$': '<rootDir>/src/users/$1',
    '^@records/(.*)$': '<rootDir>/src/records/$1',
    '^@tournament/(.*)$': '<rootDir>/src/tournament/$1',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};

export default config;
