'use client'

import { useEffect, useState } from 'react'
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '@/lib/api'

interface EventTranslation {
  locale: string
  title: string
  description: string
  fullDescription?: string
  location: string
  pricing?: {
    normal: {
      price: number
      label: string
    }
    student?: {
      price: number
      label: string
    }
  }
  program?: {
    items: string[]
  }
  whyParticipate?: string
}

interface Event {
  id: string
  date: string
  price: number
  capacity?: number
  women_only: boolean
  display_places: boolean
  image_url?: string
  contact_info?: {
    instagram?: string
    email?: string
  }
  translations: Array<{
    locale: string
    title: string
    description: string
    full_description?: string
    location: string
    pricing?: any
    program?: any
    why_participate?: string
  }>
}

const BLANK_TRANSLATION_TEMPLATE = {
  fr: {
    title: "",
    description: "",
    fullDescription: "",
    location: "",
    program: {
      items: []
    },
    whyParticipate: ""
  },
  en: {
    title: "",
    description: "",
    fullDescription: "",
    location: "",
    program: {
      items: []
    },
    whyParticipate: ""
  },
  ru: {
    title: "",
    description: "",
    fullDescription: "",
    location: "",
    program: {
      items: []
    },
    whyParticipate: ""
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const [translationJson, setTranslationJson] = useState('')
  const [importedTranslations, setImportedTranslations] = useState<EventTranslation[] | null>(null)
  const [formData, setFormData] = useState({
    id: '',
    date: '',
    price: '',
    capacity: '',
    womenOnly: false,
    displayPlaces: true,
    imageUrl: '',
    contactInfoInstagram: '',
    contactInfoEmail: '',
    pricing: null as { normal: { price: number }, student?: { price: number } } | null,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await getAllEvents()
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      id: '',
      date: '',
      price: '',
      capacity: '',
      womenOnly: false,
      displayPlaces: true,
      imageUrl: '',
      contactInfoInstagram: '',
      contactInfoEmail: '',
      pricing: null,
    })
    setEditingEvent(null)
    setShowForm(false)
    setTranslationJson('')
    setImportedTranslations(null)
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setImportedTranslations(null)
    setFormData({
      id: event.id,
      date: new Date(event.date).toISOString().slice(0, 16),
      price: event.price.toString(),
      capacity: event.capacity?.toString() || '',
      womenOnly: event.women_only,
      displayPlaces: event.display_places,
      imageUrl: event.image_url || '',
      contactInfoInstagram: event.contact_info?.instagram || '',
      contactInfoEmail: event.contact_info?.email || '',
      pricing: event.pricing || null,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cela supprimera également tous les billets associés.')) {
      return
    }

    try {
      await deleteEvent(id)
      await loadEvents()
    } catch (err: any) {
      alert('Échec de la suppression de l\'événement : ' + err.message)
    }
  }

  const openTranslationModal = () => {
    if (editingEvent && editingEvent.translations.length > 0) {
      // Export existing translations as JSON (pricing is now in events table, not translations)
      const translationsObj: any = {}
      editingEvent.translations.forEach(t => {
        translationsObj[t.locale] = {
          title: t.title,
          description: t.description,
          fullDescription: t.full_description,
          location: t.location,
          program: t.program,
          whyParticipate: t.why_participate,
        }
      })
      setTranslationJson(JSON.stringify(translationsObj, null, 2))
    } else {
      setTranslationJson(JSON.stringify(BLANK_TRANSLATION_TEMPLATE, null, 2))
    }
    setShowTranslationModal(true)
  }

  const handleTranslationImport = () => {
    try {
      const translations = JSON.parse(translationJson)
      const translationsArray = Object.entries(translations).map(([locale, data]: [string, any]) => ({
        locale,
        title: data.title || '',
        description: data.description || '',
        fullDescription: data.fullDescription || data.full_description || '',
        location: data.location || '',
        program: data.program || null,
        whyParticipate: data.whyParticipate || data.why_participate || '',
      }))

      setImportedTranslations(translationsArray)
      setShowTranslationModal(false)
      alert('Traductions importées avec succès ! Cliquez sur "Créer l\'événement" pour enregistrer.')
    } catch (err: any) {
      alert('JSON invalide : ' + err.message)
    }
  }

  const handleSave = async (translationsArray?: EventTranslation[]) => {
    try {
      setError('')

      if (!formData.id || !formData.date || !formData.price) {
        setError('ID, date, and price are required')
        return
      }

      let translations = translationsArray || importedTranslations

      if (!translations && editingEvent) {
        // Use existing translations (pricing is now in events table, not translations)
        translations = editingEvent.translations.map(t => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          fullDescription: t.full_description,
          location: t.location,
          program: t.program,
          whyParticipate: t.why_participate,
        }))
      }

      if (!translations) {
        setError('Les traductions sont requises. Veuillez utiliser la fonction d\'importation de traductions.')
        return
      }

      const eventData = {
        id: formData.id,
        date: new Date(formData.date).toISOString(),
        price: parseFloat(formData.price),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        womenOnly: formData.womenOnly,
        displayPlaces: formData.displayPlaces,
        imageUrl: formData.imageUrl || null,
        contactInfo: (formData.contactInfoInstagram || formData.contactInfoEmail) ? {
          instagram: formData.contactInfoInstagram || undefined,
          email: formData.contactInfoEmail || undefined,
        } : null,
        pricing: formData.pricing,
        translations: translations.map(t => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          fullDescription: t.fullDescription,
          location: t.location,
          program: t.program,
          whyParticipate: t.whyParticipate,
        })),
      }

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData)
      } else {
        await createEvent(eventData)
      }

      resetForm()
      setImportedTranslations(null)
      await loadEvents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const exportTranslations = (event: Event) => {
    const translationsObj: any = {}
    event.translations.forEach(t => {
      translationsObj[t.locale] = {
        title: t.title,
        description: t.description,
        fullDescription: t.full_description,
        location: t.location,
        program: t.program,
        whyParticipate: t.why_participate,
      }
    })
    const json = JSON.stringify(translationsObj, null, 2)
    navigator.clipboard.writeText(json)
    alert('Traductions copiées dans le presse-papiers !')
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des événements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Créez et gérez vos événements</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center px-5 py-2.5 bg-weydu-blue dark:bg-weydu-light-blue text-white rounded-lg hover:bg-weydu-dark-blue dark:hover:bg-weydu-blue transition-colors shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un événement
          </button>
        )}
      </div>

      {error && !showForm && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetForm()
            }
          }}
        >
          <div 
            className="relative bg-white dark:bg-gray-800 w-full max-w-4xl shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 mt-8 mb-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-weydu-blue dark:bg-weydu-light-blue rounded-lg mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {editingEvent ? 'Modifiez les informations de l\'événement' : 'Remplissez les informations de base de l\'événement'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
            {/* Section: Informations de base */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-weydu-blue dark:text-weydu-light-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informations de base
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      ID de l'événement <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingEvent}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    placeholder="event-2024-01-01"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format recommandé: event-YYYY-MM-DD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date et heure <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Prix par défaut (EUR) <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="block w-full pl-7 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Capacité
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                    placeholder="Nombre de places"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Laissez vide pour une capacité illimitée</p>
                </div>
              </div>
            </div>

            {/* Section: Options */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-weydu-blue dark:text-weydu-light-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Options
              </h3>
              <div className="space-y-3">
                <label className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id="womenOnly"
                    checked={formData.womenOnly}
                    onChange={(e) => setFormData({ ...formData, womenOnly: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-weydu-blue dark:text-weydu-light-blue focus:ring-weydu-blue dark:focus:ring-weydu-light-blue border-gray-300 dark:border-gray-600 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Événement réservé aux femmes</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Seules les femmes pourront réserver des billets pour cet événement</p>
                  </div>
                </label>
                <label className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id="displayPlaces"
                    checked={formData.displayPlaces}
                    onChange={(e) => setFormData({ ...formData, displayPlaces: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-weydu-blue dark:text-weydu-light-blue focus:ring-weydu-blue dark:focus:ring-weydu-light-blue border-gray-300 dark:border-gray-600 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Afficher les places disponibles</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Affiche le nombre de places restantes sur la page publique</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Section: Informations supplémentaires */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-weydu-blue dark:text-weydu-light-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informations supplémentaires
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      URL de l'image
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                    placeholder="https://exemple.com/image.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL de l'image à afficher pour cet événement</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Informations de contact
                    </span>
                  </label>
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">@</span>
                      </div>
                      <input
                        type="text"
                        value={formData.contactInfoInstagram}
                        onChange={(e) => setFormData({ ...formData, contactInfoInstagram: e.target.value })}
                        className="block w-full pl-8 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                        placeholder="nom_instagram"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={formData.contactInfoEmail}
                        onChange={(e) => setFormData({ ...formData, contactInfoEmail: e.target.value })}
                        className="block w-full pl-10 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 sm:text-sm transition-colors"
                        placeholder="contact@exemple.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Traductions */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-weydu-blue dark:text-weydu-light-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Traductions
              </h3>
              {importedTranslations ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Traductions importées avec succès</p>
                    <p className="text-sm">{importedTranslations.length} langue(s) disponible(s)</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium">Traductions requises</p>
                    <p className="text-sm">Vous devez importer les traductions avant de créer l'événement</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openTranslationModal}
                  className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {importedTranslations ? 'Réimporter' : 'Importer'} les traductions
                </button>
                {editingEvent && (
                  <button
                    onClick={() => exportTranslations(editingEvent)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exporter les traductions
                  </button>
                )}
              </div>
            </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleSave()}
                disabled={!formData.id || !formData.date || !formData.price || (!importedTranslations && !editingEvent)}
                className="inline-flex items-center px-6 py-2.5 bg-weydu-blue dark:bg-weydu-light-blue text-white rounded-lg hover:bg-weydu-dark-blue dark:hover:bg-weydu-blue transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editingEvent ? 'Mettre à jour' : 'Créer'} l'événement
              </button>
            </div>
          </div>
        </div>
      )}

      {showTranslationModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-[60] flex items-start justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTranslationModal(false)
            }
          }}
        >
          <div 
            className="relative bg-white dark:bg-gray-800 w-full max-w-4xl shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 mt-8 mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Importer les traductions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Importez les traductions au format JSON</p>
                </div>
              </div>
              <button
                onClick={() => setShowTranslationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Comment utiliser :</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Copiez le modèle JSON ci-dessous</li>
                      <li>Collez-le dans un traducteur IA (ChatGPT, Claude, etc.)</li>
                      <li>Demandez la traduction dans les langues souhaitées</li>
                      <li>Collez le JSON traduit dans le champ ci-dessous</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  JSON des traductions
                </label>
                <textarea
                  value={translationJson}
                  onChange={(e) => setTranslationJson(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-weydu-blue dark:focus:border-weydu-light-blue focus:ring-2 focus:ring-weydu-blue dark:focus:ring-weydu-light-blue focus:ring-opacity-20 resize-none"
                  placeholder='{\n  "fr": { ... },\n  "en": { ... },\n  "ru": { ... }\n}'
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {translationJson.length > 0 ? `${translationJson.length} caractères` : 'Collez votre JSON ici'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl">
              <button
                onClick={() => setShowTranslationModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleTranslationImport}
                className="inline-flex items-center px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Importer les traductions
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Chargement des événements...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucun événement trouvé</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                    ID Événement
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-36">
                    Date et heure
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                    Prix
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                    Capacité
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    Réservé femmes
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    Afficher places
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                    Langues
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-40 sticky right-0 bg-gray-50 dark:bg-gray-700/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 font-mono truncate max-w-[120px]" title={event.id}>
                        {event.id}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">€{event.price}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">{event.capacity || '-'}</div>
                    </td>
                    <td className="px-3 py-3">
                      {event.women_only ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300">
                          Oui
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {event.display_places ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Oui
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {event.translations.map(t => (
                            <span key={t.locale} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {t.locale}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 sticky right-0 bg-white dark:bg-gray-800 z-10">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(event)}
                          className="px-2.5 py-1 bg-weydu-blue dark:bg-weydu-light-blue text-white rounded-md hover:bg-weydu-dark-blue dark:hover:bg-weydu-blue text-xs transition-colors whitespace-nowrap"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => exportTranslations(event)}
                          className="px-2.5 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-xs transition-colors whitespace-nowrap"
                        >
                          Exporter
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="px-2.5 py-1 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 text-xs transition-colors whitespace-nowrap"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


