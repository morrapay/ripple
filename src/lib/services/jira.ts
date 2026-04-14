const JIRA_BASE_URL = process.env.JIRA_BASE_URL ?? "";
const JIRA_EMAIL = process.env.JIRA_EMAIL ?? "";
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN ?? "";
const JIRA_PROJECT_KEY_LEGAL = process.env.JIRA_PROJECT_KEY_LEGAL ?? "LEGAL";
const JIRA_PROJECT_KEY_L10N = process.env.JIRA_PROJECT_KEY_L10N ?? "L10N";

interface JiraTicketParams {
  projectKey: string;
  summary: string;
  description: string;
  issueType?: string;
  assignee?: string;
  labels?: string[];
}

interface JiraCreateResponse {
  key: string;
  self: string;
}

function jiraHeaders() {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function isConfigured(): boolean {
  return !!(JIRA_BASE_URL && JIRA_EMAIL && JIRA_API_TOKEN);
}

export async function createJiraTicket(
  params: JiraTicketParams
): Promise<{ jiraKey: string; jiraUrl: string } | null> {
  if (!isConfigured()) {
    console.warn("Jira not configured — creating placeholder ticket");
    const fakeKey = `${params.projectKey}-${Date.now().toString(36).toUpperCase()}`;
    return { jiraKey: fakeKey, jiraUrl: `#placeholder-${fakeKey}` };
  }

  const body = {
    fields: {
      project: { key: params.projectKey },
      summary: params.summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: params.description }],
          },
        ],
      },
      issuetype: { name: params.issueType ?? "Task" },
      ...(params.labels && { labels: params.labels }),
    },
  };

  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: "POST",
    headers: jiraHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Jira ticket creation failed:", err);
    return null;
  }

  const data: JiraCreateResponse = await res.json();
  return {
    jiraKey: data.key,
    jiraUrl: `${JIRA_BASE_URL}/browse/${data.key}`,
  };
}

export async function getJiraTicketStatus(
  jiraKey: string
): Promise<string | null> {
  if (!isConfigured()) return null;

  const res = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${jiraKey}?fields=status`,
    { headers: jiraHeaders() }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.fields?.status?.name ?? null;
}

export function getLegalProjectKey() {
  return JIRA_PROJECT_KEY_LEGAL;
}

export function getL10nProjectKey() {
  return JIRA_PROJECT_KEY_L10N;
}
