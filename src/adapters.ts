import semver from "semver";
import { ADAPTERS, type MojiAdapter } from "./adapter";

// base needs to be imported before
// the other adapters to ensure it is
// registered first
import "./adapter/base";

import "./adapter/v16";
import "./adapter/v15";

export function resolveAdapter(version: string): MojiAdapter | null {
  if (semver.valid(version) === null) {
    throw new Error(`version "${version}" is not a valid semver version`);
  }

  const matchingAdapters = Array.from(ADAPTERS.values()).filter((adapter) =>
    semver.satisfies(version, adapter.range),
  );

  if (matchingAdapters.length === 0) {
    throw new Error(`no adapter found for version ${version}`);
  }

  if (matchingAdapters.length > 1) {
    return matchingAdapters.reduce((selected, current) => {
      const selectedLower = semver.minVersion(selected.range);
      const currentLower = semver.minVersion(current.range);

      if (!selectedLower || !currentLower) {
        return selected;
      }

      return semver.gt(currentLower, selectedLower) ? current : selected;
    });
  }

  if (matchingAdapters.length === 1) {
    return matchingAdapters[0]!;
  }

  return null;
}
