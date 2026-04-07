// Re-export the toolbar component for the extension content script.
// The original PageFeedbackToolbarCSS component is in page-toolbar.tsx.
export { PageFeedbackToolbarCSS as Toolbar } from "./page-toolbar";
export { PageFeedbackToolbarCSS } from "./page-toolbar";
export type {
  AgentationProps,
  DemoAnnotation,
  OutputDetailLevel,
  ReactComponentMode,
  ToolbarSettings,
} from "./page-toolbar";
