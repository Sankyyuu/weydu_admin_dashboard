// API client for communicating with the ticketing service
const TICKETING_SERVICE_URL = process.env.NEXT_PUBLIC_TICKETING_SERVICE_URL || 'http://localhost:3000'

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${TICKETING_SERVICE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Tickets API
export async function getTickets(eventId?: string) {
  const endpoint = eventId 
    ? `/api/admin/tickets?eventId=${eventId}`
    : '/api/admin/tickets'
  return apiRequest(endpoint)
}

export async function validateTicket(ticketId: string, validatedBy: string) {
  return apiRequest(`/api/tickets/${ticketId}/validate`, {
    method: 'POST',
    body: JSON.stringify({ validatedBy }),
  })
}

// Events API
export async function getAllEvents() {
  return apiRequest('/api/admin/events')
}

export async function getEvent(id: string) {
  return apiRequest(`/api/admin/events/${id}`)
}

export async function createEvent(eventData: any) {
  return apiRequest('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  })
}

export async function updateEvent(id: string, eventData: any) {
  return apiRequest(`/api/admin/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  })
}

export async function deleteEvent(id: string) {
  return apiRequest(`/api/admin/events/${id}`, {
    method: 'DELETE',
  })
}

// Statistics API
export async function getStatistics() {
  return apiRequest('/api/admin/statistics')
}


