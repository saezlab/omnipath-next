# OmniPath Next

A Next.js application providing a web interface and API for querying the OmniPath molecular interaction database.

## Overview

OmniPath is a comprehensive collection of molecular biology interactions, pathways, and annotations. This application provides:

- **Web Interface**
- **MCP API**: A Model Context Protocol (MCP) endpoint (`src/app/api/[transport]/route.ts`) that enables AI assistants to query the database directly

## Features

### Database Access
The application provides read-only SQL query access to multiple biological data tables including:
- **annotations**: Protein annotations and pathway memberships
- **complexes**: Protein complex compositions
- **enzsub**: Enzyme-substrate relationships
- **interactions**: Molecular interactions and regulatory relationships
- **intercell**: Intercellular communication annotations