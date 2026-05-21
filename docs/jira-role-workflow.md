# Jira Role Workflow — BBO Project

Project: BBO — Beautynshine ERP & POS
Main board/list: https://lunagc2015.atlassian.net/jira/software/c/projects/BBO/list?jql=project%20%3D%20BBO%20ORDER%20BY%20cf%5B10019%5D%20ASC

## Role Accounts

| Role | Jira Display | Email Alias | Status |
|---|---|---|---|
| Implementer | Beautynshine Implementer | luna.gc2015+bbo.implementer@gmail.com | Created, invited |
| SA | Beautynshine System Architect | luna.gc2015+bbo.sa@gmail.com | Created, invited |
| BA | Beautynshine Business Analyst | luna.gc2015+bbo.ba@gmail.com | Created, invited |
| Developer | Beautynshine Developer | luna.gc2015+bbo.developer@gmail.com | Created, invited |
| QA | Beautynshine QA | luna.gc2015+bbo.qa@gmail.com | Created, invited |

## Important Limitation

Jira cannot assign issues to newly created users until the invited account accepts the Atlassian invitation and becomes active/assignable.

Until then:
- Role subtasks are created with role prefix in summary.
- Labels are added: `role-log`, `role-implementer`, `role-sa`, `role-ba`, `role-developer`, `role-qa`.
- Comments are posted with role headers.
- Assignment can be retried after PM accepts invitations.

## PM Instructions

1. Open the invitation emails for each role alias.
2. Accept the Atlassian invitation.
3. After all are active, tell Hermes: `assign ulang role BBO-X`.
4. Hermes will assign subtasks to each role account.

## Task Execution Standard

For every parent issue (example: BBO-5), create subtasks:

1. `[Implementer] BBO-X — Breakdown, PM Instructions & Jira Coordination`
2. `[SA] BBO-X — Architecture Review`
3. `[BA] BBO-X — Requirements & Acceptance Criteria`
4. `[Developer] BBO-X — Implementation`
5. `[QA] BBO-X — Testing & Verification`

Each subtask must contain role-specific logs and be transitioned to Done after completion.

The parent issue should contain consolidated comments and final report.
