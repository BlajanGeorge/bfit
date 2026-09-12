/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-sqlite$': '<rootDir>/test/__mocks__/expo-sqlite.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          ...require('./tsconfig.json').compilerOptions,
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-native',
          esModuleInterop: true,
          types: ['jest'],
        },
      },
    ],
  },
  testMatch: ['**/*.test.ts'],
}