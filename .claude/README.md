# Claude Configuration for MetaAds

This directory contains configuration and commands for AI-assisted development using Claude.

## Available Commands

### `/generate-prp`
Generates a Product Requirements Prompt from a feature request in INITIAL.md.
- Researches codebase for patterns
- Creates comprehensive implementation plan
- Includes validation steps

### `/execute-prp`
Executes a PRP document to implement features.
- Follows blueprint step-by-step
- Runs validation after each step
- Fixes issues automatically

## Permissions

The `settings.local.json` file grants Claude permissions to:
- Read and write files
- Execute bash commands
- Search the web for documentation
- Create new files when needed

## Workflow

1. Create feature request in `INITIAL.md`
2. Use `/generate-prp` to create plan
3. Use `/execute-prp` to implement
4. Validate and fix errors using `API_ACCESS.md`

## Self-Service Capabilities

With the current setup, Claude can:
- Fix build errors independently
- Resolve API integration issues
- Debug database problems
- Handle deployment issues

See `API_ACCESS.md` and `TROUBLESHOOTING.md` for details.