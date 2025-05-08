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
    '^@games/(.*)$': '<rootDir>/../src/games/$1',
    '^@records/(.*)$': '<rootDir>/../src/records/$1',
    '^@tournaments/(.*)$': '<rootDir>/../src/tournaments/$1',
    '^@umpires/(.*)$': '<rootDir>/../src/umpires/$1',
    '^@auth/(.*)$': '<rootDir>/../src/auth/$1',
    '^@common/(.*)$': '<rootDir>/../src/common/$1',
    '^@admin/(.*)$': '<rootDir>/../src/admin/$1',
    '^@mail/(.*)$': '<rootDir>/../src/mail/$1',
    '^@config/(.*)$': '<rootDir>/../src/config/$1',
  },
};

export default config;
