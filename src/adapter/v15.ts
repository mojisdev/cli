import { defineMojiAdapter } from "../adapter";

export default defineMojiAdapter({
  name: "v15",
  description: "adapter for version 15 & v15.1",
  range: ">=15.0.0 <16.0.0",
  extend: "base",
});
