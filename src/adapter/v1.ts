import { defineMojiAdapter } from "../adapter";

export default defineMojiAdapter({
  name: "v1",
  description: "adapter for version 1",
  range: ">=1.0.0 <2.0.0",
  extend: "base",
});
