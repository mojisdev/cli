import { slugify } from "./utils";

export interface Group {
  name: string;
  slug: string;
  subgroups: string[];
}

export function getGroups(data: string): Group[] {
  const lines = data.split("\n");
  let currentGroup: Group | undefined;

  const groups: Group[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      continue;
    }

    if (line.startsWith("# group:")) {
      const groupName = line.slice(8).trim();

      const group: Group = {
        name: groupName,
        slug: slugify(groupName),
        subgroups: [],
      };

      currentGroup = group;

      groups.push(group);
    } else if (line.startsWith("# subgroup:")) {
      const subgroupName = line.slice(11).trim();

      if (currentGroup == null) {
        throw new Error(`subgroup ${subgroupName} without group`);
      }

      currentGroup.subgroups.push(subgroupName);
    }
  }

  return groups;
}
