---
name: supabase-integration
description: Instructions for using the Supabase MCP tools (executing SQL, managing projects, migrations).
---

# Supabase Integration

This skill provides context for using the `supabase-mcp-server` tools within the Antigravity Kit.

## 🛠️ Available Tools

The following tools are available via the `supabase-mcp-server`:

- `apply_migration`: Apply DDL operations to the database.
- `execute_sql`: Execute raw SQL queries (DML/DQL).
- `list_tables`: List tables in the database.
- `get_project`: Get Supabase project details.
- `list_projects`: List all Supabase projects.

## 💡 Best Practices

- **Project ID**: The current project ID is `xmrfjrecyfgiqqjhguhd`.
- **DDL vs DML**: Use `apply_migration` for schema changes (CREATE, ALTER, DROP) and `execute_sql` for data manipulation (SELECT, INSERT, UPDATE, DELETE).
- **Verification**: Always verify table schemas using `list_tables` before generating complex queries.
- **Security**: Be cautious when executing raw SQL from untrusted inputs.

## 🔗 Integration with database-design

When working on database tasks, combine this skill with `database-design` to ensure Postgres-specific best practices are followed.
