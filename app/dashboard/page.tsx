import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllEvents, getTickets, getStatistics } from '@/lib/api'

interface Ticket {
  ticket_id: string
  event_id: string
  amount_paid: number
  validated_at: string | null
  created_at: string
}

interface Event {
  id: string
  date: string
  translations?: Array<{
    locale: string
    title: string
  }>
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data
  let events: Event[] = []
  let tickets: Ticket[] = []
  let statistics: {
    languages: Array<{ language: string; count: number }>
    schools: Array<{ school: string; count: number }>
    professions: Array<{ profession: string; count: number }>
  } = { languages: [], schools: [], professions: [] }
  let error = ''

  try {
    events = await getAllEvents()
    tickets = await getTickets()
    statistics = await getStatistics()
  } catch (err: any) {
    error = err.message
  }

  // Calculate statistics
  const totalEvents = events.length
  const totalTickets = tickets.length
  const validatedTickets = tickets.filter(t => t.validated_at).length
  const pendingTickets = totalTickets - validatedTickets
  const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.amount_paid || 0), 0)
  
  const now = new Date()
  const upcomingEvents = events.filter(event => new Date(event.date) > now).length
  const pastEvents = totalEvents - upcomingEvents

  // Get recent tickets (last 5)
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Get upcoming events (next 3)
  const upcomingEventsList = [...events]
    .filter(event => new Date(event.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getEventTitle = (event: Event) => {
    if (!event.translations || event.translations.length === 0) {
      return event.id
    }
    const french = event.translations.find(t => t.locale === 'fr')
    if (french) return french.title
    const english = event.translations.find(t => t.locale === 'en')
    if (english) return english.title
    return event.translations[0].title || event.id
  }

  const validationRate = totalTickets > 0 ? ((validatedTickets / totalTickets) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vue d'ensemble du tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Bienvenue ! Voici ce qui se passe avec vos événements et billets.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          Erreur lors du chargement des données : {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des événements</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{totalEvents}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {upcomingEvents} à venir • {pastEvents} passés
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        {/* Total Tickets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des billets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{totalTickets}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {validatedTickets} validés • {pendingTickets} en attente
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🎫</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                De {totalTickets} billets
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Validation Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de validation</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{validationRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {validatedTickets} sur {totalTickets} billets
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Événements à venir</h2>
            <Link
              href="/dashboard/events"
              className="text-sm text-weydu-blue hover:text-weydu-dark-blue"
            >
              Voir tout →
            </Link>
          </div>
          {upcomingEventsList.length > 0 ? (
            <div className="space-y-3">
              {upcomingEventsList.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{getEventTitle(event)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{event.id}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun événement à venir</p>
          )}
        </div>

        {/* Recent Tickets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Billets récents</h2>
            <Link
              href="/dashboard/tickets"
              className="text-sm text-weydu-blue hover:text-weydu-dark-blue"
            >
              Voir tout →
            </Link>
          </div>
          {recentTickets.length > 0 ? (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.ticket_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{ticket.event_id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(ticket.amount_paid || 0)} • {formatDate(ticket.created_at)}
                    </p>
                  </div>
                  {ticket.validated_at ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                      Validé
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                      En attente
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun billet pour le moment</p>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Languages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🌍</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Langues les plus parlées</h2>
          </div>
          {statistics.languages.length > 0 ? (
            <div className="space-y-3">
              {statistics.languages.slice(0, 5).map((item, index) => (
                <div key={item.language} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">{item.language}</span>
                  </div>
                  <span className="text-sm font-semibold text-weydu-blue dark:text-weydu-light-blue">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune donnée disponible</p>
          )}
        </div>

        {/* Top Schools */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🏫</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Écoles les plus représentées</h2>
          </div>
          {statistics.schools.length > 0 ? (
            <div className="space-y-3">
              {statistics.schools.slice(0, 5).map((item, index) => (
                <div key={item.school} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6 flex-shrink-0">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1" title={item.school}>
                      {item.school}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-weydu-blue dark:text-weydu-light-blue ml-2 flex-shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune donnée disponible</p>
          )}
        </div>

        {/* Top Professions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">💼</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Professions les plus fréquentes</h2>
          </div>
          {statistics.professions.length > 0 ? (
            <div className="space-y-3">
              {statistics.professions.slice(0, 5).map((item, index) => (
                <div key={item.profession} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6 flex-shrink-0">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1" title={item.profession}>
                      {item.profession}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-weydu-blue dark:text-weydu-light-blue ml-2 flex-shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/tickets"
            className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-weydu-blue dark:hover:border-weydu-light-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <span className="text-2xl mr-4">🎫</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gérer les billets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Voir et valider les billets</p>
            </div>
          </Link>
          <Link
            href="/dashboard/events"
            className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-weydu-blue dark:hover:border-weydu-light-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <span className="text-2xl mr-4">📅</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gérer les événements</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Créer et modifier les événements</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}


