# Rezom Admin CLI

A TypeScript-based Node.js CLI tool for Rezom administrative operations.

## Installation

1. Clone or download the CLI tool files
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Create a `.env` file with the following variables:

```env
BASE_URL=http://localhost:3000
ADMIN_EMAIL=admin@rezom.org
ADMIN_PASSWORD=Admin!2345
```

## Commands

### Upload Keywords

Upload keywords for a specific concept from a JSON file.

```bash
npx tsx cli.ts upload-keywords --slug <slug> --file <path>
```

**Options:**
- `--slug <slug>`: Concept slug (required)
- `--file <path>`: Path to keywords JSON file (required)
- `--dry-run`: Print payloads instead of sending requests

**File Format (JSON):**
```json
{
  "keywords": [
    {
      "label": "Innovation",
      "position": 1,
      "active": true
    },
    {
      "label": "Creativity",
      "position": 2,
      "active": true
    },
    {
      "label": "Purpose"
    }
  ]
}
```

**Example:**
```bash
npx tsx cli.ts upload-keywords --slug language-definition --file ./keywords.json
npx tsx cli.ts upload-keywords --slug language-definition --file ./keywords.json --dry-run
```

### Upload Questions

Upload questions from a YAML or JSON file.

```bash
npx tsx cli.ts upload-questions --file <path>
```

**Options:**
- `--file <path>`: Path to questions YAML/JSON file (required)
- `--dry-run`: Print payloads instead of sending requests
- `--concurrency <n>`: Concurrency level for bulk uploads (default: 5)

**File Format (YAML):**
```yaml
questions:
  - title: "What defines innovation in modern technology?"
    content: "How do we understand and measure innovation in the context of rapidly evolving technological landscapes?"
    tags: ["technology", "innovation"]
    keywords: ["Innovation", "Technology"]
    conceptSlug: "language-definition"
  
  - title: "The role of creativity in problem-solving"
    content: "Explore how creative thinking processes contribute to effective problem-solving strategies."
    tags: ["creativity", "problem-solving"]
    keywords: ["Creativity", "Problem-solving"]
    conceptSlug: "language-definition"
```

**File Format (JSON):**
```json
{
  "questions": [
    {
      "title": "What defines innovation in modern technology?",
      "content": "How do we understand and measure innovation in the context of rapidly evolving technological landscapes?",
      "tags": ["technology", "innovation"],
      "keywords": ["Innovation", "Technology"],
      "conceptSlug": "language-definition"
    }
  ]
}
```

**Examples:**
```bash
npx tsx cli.ts upload-questions --file ./questions.yaml
npx tsx cli.ts upload-questions --file ./questions.json --concurrency 3
npx tsx cli.ts upload-questions --file ./questions.yaml --dry-run
```

### Purge Define Cache

Purge cache for a specific concept.

```bash
npx tsx cli.ts purge-define --slug <slug>
```

**Options:**
- `--slug <slug>`: Concept slug (required)
- `--dry-run`: Print payloads instead of sending requests

**Example:**
```bash
npx tsx cli.ts purge-define --slug language-definition
npx tsx cli.ts purge-define --slug language-definition --dry-run
```

## API Endpoints

The CLI tool interacts with the following Rezom API endpoints:

- `POST /auth/login` - Authentication
- `PUT /define/concepts/:slug/keywords` - Upload keywords
- `POST /questions` - Create questions
- `POST /admin/cache/purge` - Purge cache

## Features

### Authentication
- Automatic login using credentials from `.env`
- JWT token management for API requests
- Graceful error handling for authentication failures

### File Validation
- Schema validation using Zod for all input files
- Support for both JSON and YAML formats (for questions)
- Clear error messages for validation failures

### Error Handling
- Pretty-printed axios error messages
- Detailed failure summaries for bulk operations
- HTTP status code and response data display

### Dry Run Mode
- Preview operations without making actual API calls
- Validate file formats and display parsed data
- Safe testing of commands and file formats

### Bulk Operations
- Configurable concurrency for question uploads
- Progress tracking with spinners
- Success/failure summaries
- Individual error reporting for failed items

## Scripts

Available npm scripts:

```bash
npm run build    # Compile TypeScript to JavaScript
npm run start    # Run the CLI tool
npm run dev      # Development mode (same as start)
```

## Error Handling

The CLI provides detailed error information:

- **Authentication errors**: Clear messages about login failures
- **File errors**: Validation errors with specific field information
- **API errors**: HTTP status codes and server response details
- **Bulk operation errors**: Individual failure reports with error messages

## Examples

### Complete Workflow Example

1. **Prepare your files:**

`keywords.json`:
```json
{
  "keywords": [
    {"label": "Innovation", "position": 1, "active": true},
    {"label": "Technology", "position": 2, "active": true},
    {"label": "Digital Transformation", "position": 3, "active": true}
  ]
}
```

`questions.yaml`:
```yaml
questions:
  - title: "How do we define digital innovation?"
    content: "What are the key characteristics that distinguish true digital innovation from incremental improvements?"
    tags: ["technology", "innovation", "digital"]
    keywords: ["Innovation", "Technology", "Digital Transformation"]
    conceptSlug: "language-definition"
```

2. **Test with dry run:**
```bash
npx tsx cli.ts upload-keywords --slug language-definition --file ./keywords.json --dry-run
npx tsx cli.ts upload-questions --file ./questions.yaml --dry-run
```

3. **Execute operations:**
```bash
npx tsx cli.ts upload-keywords --slug language-definition --file ./keywords.json
npx tsx cli.ts upload-questions --file ./questions.yaml --concurrency 3
npx tsx cli.ts purge-define --slug language-definition
```

## Requirements

- Node.js 18.0.0 or higher
- Access to Rezom API server
- Valid admin credentials

## Dependencies

- **axios**: HTTP client for API requests
- **commander**: Command-line interface framework
- **dotenv**: Environment variable management
- **zod**: Schema validation
- **ora**: Terminal spinners
- **chalk**: Terminal colors and styling
- **tsx**: TypeScript execution
- **js-yaml**: YAML file parsing