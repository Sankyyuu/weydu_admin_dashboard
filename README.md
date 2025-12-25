# Weydu Admin Dashboard

Admin dashboard for managing events and tickets in the Weydu ticketing service.

## Features

- **Authentication**: Login with Supabase (accounts created directly in Supabase)
- **Tickets Management**: View all tickets, filter by event, and validate tickets
- **Events Management**: Create, edit, and delete events
- **Translation Management**: Import/export translations using JSON format for easy AI translation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `env.example.txt`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_TICKETING_SERVICE_URL=http://localhost:3000
```

3. Make sure the ticketing service is running on port 3000 (or update the URL in `.env`)

4. Create admin accounts in Supabase:
   - Go to Supabase Dashboard > Authentication > Users
   - Create a new user with email and password
   - This user can now login to the admin dashboard

5. Run the development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:3001`

## Usage

### Login
- Navigate to `/login`
- Use credentials created in Supabase

### Tickets Management
- View all tickets or filter by event
- Click "Validate" button to validate a ticket
- See ticket details including customer info, quantity, amount paid, etc.

### Events Management
- Click "Add New Event" to create an event
- Fill in event details (ID, date, price, etc.)
- Use "Import Translations (JSON)" to add translations:
  1. Click the button to open the modal
  2. Copy the blank template JSON
  3. Paste it into an AI translator (ChatGPT, Claude, etc.)
  4. Paste the translated JSON back
  5. Click "Import"
  6. Click "Create Event" to save
- Click "Edit" on an event to modify it
- Click "Export Translations" to copy translations JSON
- Click "Delete" to remove an event (this will also delete associated tickets)

## Translation JSON Format

The translation JSON follows this structure:
```json
{
  "fr": {
    "title": "",
    "description": "",
    "fullDescription": "",
    "location": "",
    "pricing": {
      "normal": {
        "price": 0,
        "label": ""
      },
      "student": {
        "price": 0,
        "label": ""
      }
    },
    "program": {
      "items": []
    },
    "whyParticipate": ""
  },
  "en": { ... },
  "ru": { ... }
}
```

## API Endpoints Used

The dashboard communicates with the ticketing service API:
- `GET /api/admin/tickets` - List all tickets
- `POST /api/tickets/[id]/validate` - Validate a ticket
- `GET /api/admin/events` - List all events
- `GET /api/admin/events/[id]` - Get event details
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/[id]` - Update event
- `DELETE /api/admin/events/[id]` - Delete event

