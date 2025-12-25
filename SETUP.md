# Admin Dashboard Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd weydu_admin_dashboard
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_TICKETING_SERVICE_URL=http://localhost:3000
   ```

3. **Create admin user in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Save the credentials for login

4. **Start the ticketing service** (in another terminal):
   ```bash
   cd weydu_ticketing_service
   npm run dev
   ```

5. **Start the admin dashboard:**
   ```bash
   cd weydu_admin_dashboard
   npm run dev
   ```

6. **Access the dashboard:**
   - Open http://localhost:3001
   - Login with the credentials created in step 3

## Features Overview

### Tickets Management (`/dashboard/tickets`)
- View all tickets or filter by event
- See customer details, quantity, amount paid
- Validate tickets with one click
- View validation status and history

### Events Management (`/dashboard/events`)
- Create new events with all details
- Edit existing events
- Delete events (cascades to tickets)
- Import translations via JSON:
  1. Click "Import Translations (JSON)"
  2. Copy the blank template
  3. Paste into AI translator (ChatGPT, Claude, etc.)
  4. Copy translated JSON back
  5. Click "Import"
  6. Save the event
- Export translations for editing

## Translation Workflow

1. **For new events:**
   - Fill in event basic info (ID, date, price, etc.)
   - Click "Import Translations (JSON)"
   - Copy the blank template JSON
   - Use AI to translate all three languages (fr, en, ru)
   - Paste translated JSON back
   - Click "Import"
   - Click "Create Event"

2. **For existing events:**
   - Click "Export Translations" to get current translations
   - Edit the JSON as needed
   - Click "Edit" → "Import Translations (JSON)"
   - Paste updated JSON
   - Click "Import" → "Update Event"

## API Endpoints

The admin dashboard uses these endpoints from the ticketing service:

- `GET /api/admin/tickets` - List tickets
- `POST /api/tickets/[id]/validate` - Validate ticket
- `GET /api/admin/events` - List events
- `GET /api/admin/events/[id]` - Get event
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/[id]` - Update event
- `DELETE /api/admin/events/[id]` - Delete event

## Troubleshooting

**Can't login:**
- Verify Supabase credentials in `.env`
- Check that user exists in Supabase Authentication
- Check browser console for errors

**API errors:**
- Ensure ticketing service is running on port 3000
- Check `NEXT_PUBLIC_TICKETING_SERVICE_URL` in `.env`
- Verify CORS settings if services are on different origins

**Translation import fails:**
- Verify JSON is valid (use a JSON validator)
- Ensure all required fields are present
- Check that locale keys are: fr, en, ru

