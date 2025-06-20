/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Jest environment type declarations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}

export {};