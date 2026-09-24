# Remote Jobs

A curated list of remote job boards and career sites, organized alphabetically.

## Overview

[jobs.md](jobs.md) lists companies and platforms that post remote job opportunities. Each entry has a display name linking to the careers page, plus the plain URL.

Jump to a letter using the table of contents at the top of [jobs.md](jobs.md).

## Structure

Sections run `0-9`, then `A`–`Z`. Letters with no entries are omitted. Within each section, sites are sorted alphabetically:

```markdown
## A

| Site | URL |
| --- | --- |
| [Adobe](https://www.adobe.com/careers.html) | https://www.adobe.com/careers.html |
```

## Adding New Sites

1. Open `jobs.md` and find the section for the site's first letter (create the section if needed).
2. Add a row anywhere in that table:

```markdown
| [Site Display Name](https://example.com) | https://example.com |
```

3. Keep the link URL and plain URL the same.

You don't need to sort rows or update the table of contents yourself — the formatter handles that.

## Formatting

Run the formatter locally before opening a PR:

```bash
node scripts/format-jobs.mjs
```

It rewrites `jobs.md` to:

- Sort sections `0-9`, then `A`–`Z`
- Sort rows alphabetically by site name
- Rebuild the letter table of contents
- Normalize table syntax and sync plain URLs with link URLs
- Use LF line endings

### CI

The [Format markdown](.github/workflows/format-markdown.yml) GitHub Action runs on pushes to `main` and on pull requests that touch `**.md`. It runs the formatter and, if anything changed, commits `style: format jobs.md [skip ci]` back to the branch.

Pull requests from forks cannot be pushed to by the action — those fail the check with a diff. Run `node scripts/format-jobs.mjs` and push the result to fix them.

## Contributing

1. Fork the repository
2. Add new job sites to the appropriate section in `jobs.md`
3. Run `node scripts/format-jobs.mjs`
4. Submit a pull request

## License

This project is open for contributions. No specific license required.
