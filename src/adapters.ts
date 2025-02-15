import semver from "semver";
import { ADAPTERS, type MojiAdapter } from "./adapter";

import "./adapter/v16";
import "./adapter/v15";
import "./adapter/v14";
import "./adapter/v13";
import "./adapter/v12";
import "./adapter/v11";
import "./adapter/v4-5";
import "./adapter/v2-3";
import "./adapter/v1";
import "./adapter/base";

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
        if (selected.extend == null) {
          return selected;
        }

        const parent = ADAPTERS.get(selected.extend);

        if (parent == null) {
          throw new Error(`adapter ${selected.name} extends ${selected.extend}, but ${selected.extend} is not registered`);
        }

        return {
          ...parent,
          ...selected,
        };
      }

      const adapter = semver.gt(currentLower, selectedLower) ? current : selected;

      if (adapter.extend == null) {
        return adapter;
      }

      const parent = ADAPTERS.get(adapter.extend);

      if (parent == null) {
        throw new Error(`adapter ${adapter.name} extends ${adapter.extend}, but ${adapter.extend} is not registered`);
      }

      return {
        ...parent,
        ...adapter,
      };
    });
  }

  if (matchingAdapters.length === 1 && matchingAdapters[0] != null) {
    const adapter = matchingAdapters[0];

    if (adapter.extend == null) {
      return adapter;
    }

    const parent = ADAPTERS.get(adapter.extend);

    if (parent == null) {
      throw new Error(`adapter ${adapter.name} extends ${adapter.extend}, but ${adapter.extend} is not registered`);
    }

    return {
      ...parent,
      ...adapter,
    };
  }

  return null;
}
