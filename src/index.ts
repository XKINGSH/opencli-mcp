import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

const execFileAsync = promisify(execFile);

const OPENCLI_PATH =
  process.env.OPENCLI_PATH ||
  resolve(process.env.HOME || "/root", "opencli/dist/main.js");

async function runOpencli(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync("node", [OPENCLI_PATH, ...args], {
      timeout: 30000,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    if (stderr && !stdout) {
      return `stderr: ${stderr}`;
    }
    return stdout || "(no output)";
  } catch (err: any) {
    const msg = err?.stdout || err?.stderr || err?.message || String(err);
    return `Error: ${msg}`;
  }
}

const server = new Server(
  { name: "opencli-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "opencli",
      description:
        "Run any opencli command. 390 commands across 65 platforms including hackernews, arxiv, wikipedia, bilibili, zhihu, weibo, xiaohongshu, douyin, twitter, reddit, youtube, github, bloomberg, hf, steam, v2ex, notion, discord, etc. Use opencli_list first to discover available sites and commands.",
      inputSchema: {
        type: "object",
        properties: {
          site: {
            type: "string",
            description: "Platform/site name, e.g. hackernews, arxiv, zhihu, bilibili",
          },
          command: {
            type: "string",
            description: "Command to run on the site, e.g. top, search, user, trending",
          },
          args: {
            type: "array",
            items: { type: "string" },
            description: "Positional arguments for the command",
          },
          options: {
            type: "object",
            additionalProperties: { type: "string" },
            description: 'CLI flags as key-value pairs, e.g. {"limit": "10", "query": "rust"}',
          },
        },
        required: ["site", "command"],
      },
    },
    {
      name: "opencli_list",
      description:
        "List all available opencli sites and commands. Returns the full command catalog with strategies ([public], [cookie], [intercept], [ui]).",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "opencli_help",
      description: "Get help and usage details for a specific opencli site or command.",
      inputSchema: {
        type: "object",
        properties: {
          site: {
            type: "string",
            description: "Platform/site name, e.g. hackernews",
          },
          command: {
            type: "string",
            description: "Specific command name (optional — omit to get site-level help)",
          },
        },
        required: ["site"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "opencli_list") {
    const output = await runOpencli(["list"]);
    return { content: [{ type: "text", text: output }] };
  }

  if (name === "opencli_help") {
    const { site, command } = args as { site: string; command?: string };
    const helpArgs = command
      ? [site, command, "--help"]
      : [site, "--help"];
    const output = await runOpencli(helpArgs);
    return { content: [{ type: "text", text: output }] };
  }

  if (name === "opencli") {
    const { site, command, args: positional = [], options = {} } = args as {
      site: string;
      command: string;
      args?: string[];
      options?: Record<string, string>;
    };

    const cmdArgs: string[] = [site, command, ...positional];

    for (const [key, value] of Object.entries(options)) {
      cmdArgs.push(`--${key}`, value);
    }

    if (!cmdArgs.includes("--format")) {
      cmdArgs.push("--format", "json");
    }

    const output = await runOpencli(cmdArgs);
    return { content: [{ type: "text", text: output }] };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("opencli-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
