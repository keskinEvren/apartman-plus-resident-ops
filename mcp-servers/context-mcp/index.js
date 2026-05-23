#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

function getMemoryPath() {
  const p = process.env.MEMORY_FILE_PATH || process.env.MEMORY_PATH;
  if (!p) {
    throw new Error("MEMORY_FILE_PATH is not set");
  }
  return p;
}

function ensureFile(path) {
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(path, "", "utf-8");
  }
}

function readLines(path) {
  ensureFile(path);
  const raw = readFileSync(path, "utf-8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeLines(path, lines) {
  ensureFile(path);
  const text =
    lines.map((o) => JSON.stringify(o)).join("\n") + (lines.length ? "\n" : "");
  writeFileSync(path, text, "utf-8");
}

function normalizeGraph(lines) {
  const entitiesByName = new Map();
  const relations = [];

  for (const item of lines) {
    if (item.type === "entity") {
      const name = String(item.name);
      const entityType = String(item.entityType || "");
      const observations = Array.isArray(item.observations)
        ? item.observations.map(String)
        : [];
      const existing = entitiesByName.get(name);
      if (!existing) {
        entitiesByName.set(name, {
          name,
          entityType,
          observations: [...observations],
        });
      } else {
        // Merge observations
        const merged = new Set([
          ...(existing.observations || []),
          ...observations,
        ]);
        existing.entityType = existing.entityType || entityType;
        existing.observations = Array.from(merged);
      }
    } else if (item.type === "relation") {
      const from = String(item.from);
      const to = String(item.to);
      const relationType = String(item.relationType);
      relations.push({ from, to, relationType });
    }
  }

  return {
    entities: Array.from(entitiesByName.values()),
    relations,
  };
}

function appendEntityLines(lines, entities) {
  for (const e of entities) {
    lines.push({
      type: "entity",
      name: e.name,
      entityType: e.entityType,
      observations: Array.isArray(e.observations) ? e.observations : [],
    });
  }
}

function appendObservationLines(lines, observations) {
  for (const obs of observations) {
    const entityName = obs.entityName;
    const contents = Array.isArray(obs.contents) ? obs.contents : [];
    // Represent observations as entity lines merged by name
    lines.push({
      type: "entity",
      name: entityName,
      entityType: "",
      observations: contents,
    });
  }
}

function appendRelationLines(lines, relations) {
  for (const r of relations) {
    lines.push({
      type: "relation",
      from: r.from,
      to: r.to,
      relationType: r.relationType,
    });
  }
}

function deleteEntitiesFromLines(lines, entityNames) {
  const set = new Set(entityNames.map(String));
  return lines.filter((l) => {
    if (l.type === "entity") return !set.has(String(l.name));
    if (l.type === "relation")
      return !set.has(String(l.from)) && !set.has(String(l.to));
    return true;
  });
}

function deleteRelationsFromLines(lines, rels) {
  return lines.filter((l) => {
    if (l.type !== "relation") return true;
    return !rels.some(
      (r) =>
        String(l.from) === String(r.from) &&
        String(l.to) === String(r.to) &&
        String(l.relationType) === String(r.relationType)
    );
  });
}

function deleteObservationsFromLines(lines, deletions) {
  // Convert to graph, remove specified observation strings, then rewrite entities+relations back to lines.
  const graph = normalizeGraph(lines);
  const byName = new Map(graph.entities.map((e) => [e.name, e]));
  for (const d of deletions) {
    const name = String(d.entityName);
    const remove = new Set((d.observations || []).map(String));
    const ent = byName.get(name);
    if (!ent) continue;
    ent.observations = (ent.observations || []).filter((o) => !remove.has(o));
  }
  const newLines = [];
  appendEntityLines(newLines, Array.from(byName.values()));
  appendRelationLines(newLines, graph.relations);
  return newLines;
}

function searchGraph(graph, query) {
  const q = String(query || "").toLowerCase();
  if (!q) return [];

  const hits = [];
  for (const e of graph.entities) {
    const hay = [e.name, e.entityType, ...(e.observations || [])]
      .join("\n")
      .toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        name: e.name,
        entityType: e.entityType,
        observations: e.observations || [],
      });
    }
  }
  return hits;
}

function openNodes(graph, names) {
  const set = new Set((names || []).map(String));
  return graph.entities
    .filter((e) => set.has(e.name))
    .map((e) => ({
      name: e.name,
      entityType: e.entityType,
      observations: e.observations || [],
    }));
}

const server = new Server(
  { name: "asanmod-memory-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Initialize handler (required for MCP SDK)
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "asanmod-memory-mcp",
      version: "1.0.0",
    },
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_graph",
      description: "Read the knowledge graph.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "search_nodes",
      description: "Search nodes by query.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
    {
      name: "open_nodes",
      description: "Open nodes by names.",
      inputSchema: {
        type: "object",
        properties: { names: { type: "array", items: { type: "string" } } },
        required: ["names"],
      },
    },
    {
      name: "create_entities",
      description: "Create entities.",
      inputSchema: {
        type: "object",
        properties: {
          entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                entityType: { type: "string" },
                observations: { type: "array", items: { type: "string" } },
              },
              required: ["name", "entityType", "observations"],
            },
          },
        },
        required: ["entities"],
      },
    },
    {
      name: "add_observations",
      description: "Add observations to existing entities.",
      inputSchema: {
        type: "object",
        properties: {
          observations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entityName: { type: "string" },
                contents: { type: "array", items: { type: "string" } },
              },
              required: ["entityName", "contents"],
            },
          },
        },
        required: ["observations"],
      },
    },
    {
      name: "create_relations",
      description: "Create relations between entities.",
      inputSchema: {
        type: "object",
        properties: {
          relations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                relationType: { type: "string" },
              },
              required: ["from", "to", "relationType"],
            },
          },
        },
        required: ["relations"],
      },
    },
    {
      name: "delete_entities",
      description: "Delete entities.",
      inputSchema: {
        type: "object",
        properties: {
          entityNames: { type: "array", items: { type: "string" } },
        },
        required: ["entityNames"],
      },
    },
    {
      name: "delete_relations",
      description: "Delete relations.",
      inputSchema: {
        type: "object",
        properties: {
          relations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                relationType: { type: "string" },
              },
              required: ["from", "to", "relationType"],
            },
          },
        },
        required: ["relations"],
      },
    },
    {
      name: "delete_observations",
      description: "Delete observations from entities.",
      inputSchema: {
        type: "object",
        properties: {
          deletions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entityName: { type: "string" },
                observations: { type: "array", items: { type: "string" } },
              },
              required: ["entityName", "observations"],
            },
          },
        },
        required: ["deletions"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const path = getMemoryPath();
    const lines = readLines(path);

    if (name === "read_graph") {
      const graph = normalizeGraph(lines);
      return {
        content: [{ type: "text", text: JSON.stringify(graph, null, 2) }],
      };
    }

    if (name === "search_nodes") {
      const graph = normalizeGraph(lines);
      const results = searchGraph(graph, args?.query);
      return {
        content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }],
      };
    }

    if (name === "open_nodes") {
      const graph = normalizeGraph(lines);
      const results = openNodes(graph, args?.names);
      return {
        content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }],
      };
    }

    if (name === "create_entities") {
      const newLines = [...lines];
      appendEntityLines(newLines, args?.entities || []);
      writeLines(path, newLines);
      return { content: [{ type: "text", text: "OK" }] };
    }

    if (name === "add_observations") {
      const newLines = [...lines];
      appendObservationLines(newLines, args?.observations || []);
      writeLines(path, newLines);
      return { content: [{ type: "text", text: "OK" }] };
    }

    if (name === "create_relations") {
      const newLines = [...lines];
      appendRelationLines(newLines, args?.relations || []);
      writeLines(path, newLines);
      return { content: [{ type: "text", text: "OK" }] };
    }

    if (name === "delete_entities") {
      const updated = deleteEntitiesFromLines(lines, args?.entityNames || []);
      writeLines(path, updated);
      return { content: [{ type: "text", text: "OK" }] };
    }

    if (name === "delete_relations") {
      const updated = deleteRelationsFromLines(lines, args?.relations || []);
      writeLines(path, updated);
      return { content: [{ type: "text", text: "OK" }] };
    }

    if (name === "delete_observations") {
      const updated = deleteObservationsFromLines(lines, args?.deletions || []);
      writeLines(path, updated);
      return { content: [{ type: "text", text: "OK" }] };
    }

    return {
      content: [{ type: "text", text: `Error: Unknown tool: ${name}` }],
    };
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Error: ${error?.message || String(error)}` },
      ],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
