# JobDesk

Next.js + Prisma (MongoDB) job application tracker. The `jobdesk` MCP server
(`.mcp.json`) exposes the live app's `/api/mcp` endpoint; it needs the
`JOBDESK_MCP_TOKEN` env var and network access to `tracker.masumislambadsha.com`.

## Job application workflow

The user works in batches: they paste several job descriptions over the day
(typically 7–10), then open the Gmail app once and send all the drafts. Don't
wait for a "sent" confirmation between jobs.

When the user pastes a job description (or a link to one):

1. Write an application email: recipient address (from the JD), subject, body.
   If the JD asks for form answers instead, write those field values.
2. Save the email as a Gmail draft (Gmail MCP `create_draft`). Never send it —
   the user opens the draft, attaches their resume, and sends it themselves.
   Do not attach a resume. Don't offer `mailto:` links; they don't open in
   the Claude Code app. The user sends from Gmail app → Drafts.
3. Right after drafting, log it with the `jobdesk` `add_application` tool:
   company, position, the real job posting link (or the placeholder the tool
   describes), status `APPLIED`, today's date, and a follow-up date about a
   week out. If `jobdesk` isn't connected, say so instead of pretending it
   was logged.
4. Reply briefly (recipient, subject, logged) so the next JD can follow.
   If the user later says a draft wasn't sent, delete or update that entry.
