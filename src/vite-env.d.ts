/// <reference types="vite/client" />

// Vite ?inline CSS imports return a string
declare module "*.css?inline" {
  const css: string;
  export default css;
}

// SCSS module imports return class name mappings
declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

// Chrome extension API types
/// <reference types="chrome" />
