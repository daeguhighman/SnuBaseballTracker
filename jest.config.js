"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
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
        '^@tournaments/(.*)$': '<rootDir>/src/tournaments/$1',
        '^@games/(.*)$': '<rootDir>/src/games/$1',
        '^@common/(.*)$': '<rootDir>/src/common/$1',
        '^@umpires/(.*)$': '<rootDir>/src/umpires/$1',
        '^@auth/(.*)$': '<rootDir>/src/auth/$1',
        '^@admin/(.*)$': '<rootDir>/src/admin/$1',
        '^@mail/(.*)$': '<rootDir>/src/mail/$1',
    },
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map