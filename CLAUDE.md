# JobDesk

Next.js + Prisma (MongoDB) job application tracker. The `jobdesk` MCP server
(`.mcp.json`) exposes the live app's `/api/mcp` endpoint; it needs the
`JOBDESK_MCP_TOKEN` env var and network access to `tracker.masumislambadsha.com`.

## Job application workflow

When the user pastes a job description (or a link to one):

1. Write an application email: recipient address (from the JD), subject, body.
   If the JD asks for form answers instead, write those field values.
2. Save the email as a Gmail draft (Gmail MCP `create_draft`). Never send it —
   the user opens the draft, attaches their resume, and sends it themselves.
   Do not attach a resume.
3. When the user says it's sent ("sent, log it"), log it with the `jobdesk`
   `add_application` tool: company, position, the real job posting link
   (or the placeholder the tool describes), status, and a follow-up date.
   If `jobdesk` isn't connected, say so instead of pretending it was logged.
