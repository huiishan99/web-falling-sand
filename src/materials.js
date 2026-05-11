import { MATERIAL } from "./constants.js";

export const MATERIALS = {
  [MATERIAL.EMPTY]: {
    id: MATERIAL.EMPTY,
    key: "empty",
    label: "Empty",
    density: 0,
    solid: false
  },
  [MATERIAL.WALL]: {
    id: MATERIAL.WALL,
    key: "wall",
    label: "Wall",
    density: 100,
    solid: true
  },
  [MATERIAL.WATER]: {
    id: MATERIAL.WATER,
    key: "water",
    label: "Water",
    density: 1,
    solid: false
  },
  [MATERIAL.SAND]: {
    id: MATERIAL.SAND,
    key: "sand",
    label: "Sand",
    density: 5,
    solid: false
  },
  [MATERIAL.SAND_SOURCE]: {
    id: MATERIAL.SAND_SOURCE,
    key: "sandSource",
    label: "Sand Source",
    density: 100,
    solid: true,
    sourceProduct: MATERIAL.SAND
  },
  [MATERIAL.WATER_SOURCE]: {
    id: MATERIAL.WATER_SOURCE,
    key: "waterSource",
    label: "Water Source",
    density: 100,
    solid: true,
    sourceProduct: MATERIAL.WATER
  }
};

export const TOOLS = [
  { id: "sand", material: MATERIAL.SAND, label: "Sand", key: "1", title: "Sand" },
  { id: "water", material: MATERIAL.WATER, label: "Water", key: "2", title: "Water" },
  { id: "wall", material: MATERIAL.WALL, label: "Wall", key: "3", title: "Wall" },
  {
    id: "sandSource",
    material: MATERIAL.SAND_SOURCE,
    label: "S Source",
    key: "4",
    title: "Sand Source"
  },
  {
    id: "waterSource",
    material: MATERIAL.WATER_SOURCE,
    label: "W Source",
    key: "5",
    title: "Water Source"
  },
  { id: "erase", material: MATERIAL.EMPTY, label: "Erase", key: "6", title: "Eraser" }
];

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]));

export function isSource(type) {
  return type === MATERIAL.SAND_SOURCE || type === MATERIAL.WATER_SOURCE;
}
