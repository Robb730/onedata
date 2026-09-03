# OneData System — ERD Diagram Guide

/e
---

## ERD Creation Tools

To create the ERD visually, use one of these tools with the schema above:

| Tool | Type | Link |
|---|---|---|
| **dbdiagram.io** | Online (DBML) | https://dbdiagram.io |
| **draw.io** | Online / Desktop | https://draw.io |
| **Lucidchart** | Online | https://lucidchart.com |
| **DBeaver** | Desktop (free) | Connect to Supabase DB → ER Diagram |
| **pgAdmin** | Desktop (free) | Connect to Supabase DB → ER Diagram |
| **Mermaid Live** | Online (text-based) | https://mermaid.live |

### Recommended Approach

1. **Quick ERD:** Use `mermaid.live` — paste the Mermaid code from above, renders instantly
2. **Detailed ERD:** Use `dbdiagram.io` — convert the table definitions to DBML syntax for interactive diagrams
3. **Database-native:** Connect DBeaver or pgAdmin directly to Supabase PostgreSQL → auto-generate ERD from live schema

---

*Generated from OneData codebase analysis — September 2026*
