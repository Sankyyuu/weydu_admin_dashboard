'use client'

import { useEffect, useState } from 'react'
import { getTickets, validateTicket, getAllEvents } from '@/lib/api'
import { formatDateInParis, formatDateTimeInParis } from '@/lib/date-utils'

interface Ticket {
  ticket_id: string
  event_id: string
  customer_name: string
  customer_email: string
  quantity: number
  ticket_type: string
  amount_paid: number
  validated_at: string | null
  validated_by: string | null
  created_at: string
  profession?: string
  school?: string
  languages?: string[]
}

interface Event {
  id: string
  date: string
  translations?: Array<{
    locale: string
    title: string
  }>
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [searchCustomerName, setSearchCustomerName] = useState<string>('')
  const [searchCustomerEmail, setSearchCustomerEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    loadEvents()
    loadTickets()
  }, [])

  useEffect(() => {
    loadTickets()
  }, [selectedEventId])

  const loadEvents = async () => {
    try {
      const data = await getAllEvents()
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await getTickets(selectedEventId || undefined)
      setTickets(data)
      setFilteredTickets(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter tickets based on search criteria
  useEffect(() => {
    let filtered = [...tickets]

    if (searchCustomerName.trim() !== '') {
      filtered = filtered.filter(ticket =>
        ticket.customer_name.toLowerCase().includes(searchCustomerName.toLowerCase())
      )
    }

    if (searchCustomerEmail.trim() !== '') {
      filtered = filtered.filter(ticket =>
        ticket.customer_email.toLowerCase().includes(searchCustomerEmail.toLowerCase())
      )
    }

    setFilteredTickets(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [tickets, searchCustomerName, searchCustomerEmail])

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const handleValidate = async (ticketId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir valider ce billet ?')) {
      return
    }

    try {
      setValidating(ticketId)
      await validateTicket(ticketId, 'admin')
      await loadTickets()
    } catch (err: any) {
      alert('Échec de la validation du billet : ' + err.message)
    } finally {
      setValidating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return formatDateTimeInParis(dateString, 'fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getEventTitle = (event: Event) => {
    if (!event.translations || event.translations.length === 0) {
      return event.id
    }
    // Prefer French, then English, then first available
    const french = event.translations.find(t => t.locale === 'fr')
    if (french) return french.title
    const english = event.translations.find(t => t.locale === 'en')
    if (english) return english.title
    return event.translations[0].title || event.id
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Gestion des billets</h1>
        
        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-weydu-blue dark:text-weydu-light-blue mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtres de recherche</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Event Filter */}
            <div className="relative">
              <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Événement
                </span>
              </label>
              <div className="relative">
                <select
                  id="event-filter"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                >
                  <option value="">Tous les événements</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {formatDateInParis(event.date, 'fr-FR')} - {getEventTitle(event)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Customer Name Filter */}
            <div className="relative">
              <label htmlFor="search-customer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nom du client
                </span>
              </label>
              <div className="relative">
                <input
                  id="search-customer-name"
                  type="text"
                  value={searchCustomerName}
                  onChange={(e) => setSearchCustomerName(e.target.value)}
                  placeholder="Rechercher un nom..."
                  className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchCustomerName && (
                  <button
                    onClick={() => setSearchCustomerName('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Customer Email Filter */}
            <div className="relative">
              <label htmlFor="search-customer-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </span>
              </label>
              <div className="relative">
                <input
                  id="search-customer-email"
                  type="email"
                  value={searchCustomerEmail}
                  onChange={(e) => setSearchCustomerEmail(e.target.value)}
                  placeholder="Rechercher un email..."
                  className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchCustomerEmail && (
                  <button
                    onClick={() => setSearchCustomerEmail('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <button
                onClick={loadTickets}
                className="inline-flex items-center px-4 py-2 bg-weydu-blue dark:bg-weydu-light-blue text-white rounded-lg hover:bg-weydu-dark-blue dark:hover:bg-weydu-blue transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
              {(searchCustomerName || searchCustomerEmail || selectedEventId) && (
                <button
                  onClick={() => {
                    setSearchCustomerName('')
                    setSearchCustomerEmail('')
                    setSelectedEventId('')
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {filteredTickets.length !== tickets.length && (
                <div className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {filteredTickets.length} sur {tickets.length} billets
                </div>
              )}
              <div className="flex items-center gap-2">
                <label htmlFor="items-per-page" className="text-sm text-gray-700 dark:text-gray-300">
                  Par page:
                </label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-weydu-blue dark:border-weydu-light-blue"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des billets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Aucun billet trouvé</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Aucun billet ne correspond à votre recherche</p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                    Client
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-40">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    ID Événement
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                    Montant
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    Profession
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    École
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                    Langues
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    Créé le
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                    Statut
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    Validé le
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24 sticky right-0 bg-gray-50 dark:bg-gray-700/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.ticket_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]" title={ticket.customer_name}>
                        {ticket.customer_name}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[160px]" title={ticket.customer_email}>
                        {ticket.customer_email}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-mono truncate max-w-[100px]" title={ticket.event_id}>
                        {ticket.event_id}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {ticket.ticket_type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(ticket.amount_paid || 0)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[100px]" title={ticket.profession || undefined}>
                        {ticket.profession || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[100px]" title={ticket.school || undefined}>
                        {ticket.school || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {ticket.languages && ticket.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[120px]">
                            {ticket.languages.slice(0, 2).map((lang, idx) => (
                              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {lang}
                              </span>
                            ))}
                            {ticket.languages.length > 2 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                +{ticket.languages.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">{formatDateInParis(ticket.created_at, 'fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                    </td>
                    <td className="px-3 py-3">
                      {ticket.validated_at ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.validated_at ? (
                          <div>
                            <div>{formatDateInParis(ticket.validated_at, 'fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                            {ticket.validated_by && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]" title={ticket.validated_by}>
                                par {ticket.validated_by}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 sticky right-0 bg-white dark:bg-gray-800 z-10">
                      {!ticket.validated_at && (
                        <button
                          onClick={() => handleValidate(ticket.ticket_id)}
                          disabled={validating === ticket.ticket_id}
                          className="px-3 py-1.5 text-xs bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {validating === ticket.ticket_id ? 'Validation...' : 'Valider'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredTickets.length)}</span> sur{' '}
                    <span className="font-medium">{filteredTickets.length}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Précédent</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      if (!showPage) {
                        // Show ellipsis
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                              ...
                            </span>
                          )
                        }
                        return null
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-weydu-blue dark:bg-weydu-light-blue border-weydu-blue dark:border-weydu-light-blue text-white'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Suivant</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


