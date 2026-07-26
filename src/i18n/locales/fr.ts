const fr = {
  nav: {
    dashboard: 'Tableau de bord',
    apiDocs: 'Documentation API',
    toggleMenu: 'Basculer le menu',
    toggleAlerts: 'Basculer les alertes de prix',
    appName: 'Stellar Oracle',
  },
  footer: {
    text: 'Stellar Unified Price Oracle · Portail développeur & Tableau de bord analytique',
  },

  dashboard: {
    title: "Tableau de bord Oracle des Prix",
    subtitle: 'Agrégé depuis Chainlink, Redstone, Band & Reflector',
    search: {
      placeholder: 'Rechercher une paire d\'actifs...',
      ariaLabel: 'Rechercher une paire d\'actifs',
    },
    filter: {
      toggle: 'Filtrer',
      ariaLabel: 'Basculer le panneau de filtres',
    },
    select: {
      button: 'Sélectionner',
      buttonWithCount: 'Sélectionner ({{count}})',
      ariaLabel: 'Basculer le mode de sélection',
    },
    viewToggle: {
      ariaLabel: 'Basculer la vue',
      card: 'Vue cartes',
      table: 'Vue tableau',
    },
    alerts: {
      ariaLabel: 'Configurer les canaux de notification',
      title: 'Alertes',
    },
    selection: {
      count: '{{count}} sélectionné(s)',
      selectAll: 'Tout sélectionner',
      deselectAll: 'Tout désélectionner',
      exportCsv: 'Exporter CSV',
    },
    emptyState: {
      noFeeds: 'Aucun flux de prix disponible',
      noFeedsDetail: "Connectez-vous à l'API de l'agrégateur pour voir les données.",
      noResults: 'Aucun résultat',
      noResultsSearch: 'Aucun résultat pour "{{search}}"',
      noResultsFilterHint: 'Essayez d\'ajuster vos filtres.',
      noResultsSearchHint: 'Essayez un terme de recherche différent.',
    },
    loadingAriaLabel: 'Chargement des cartes de prix',
    feedsAriaLabel: 'Flux de prix',
  },

  filter: {
    title: 'Filtres & Trier',
    clearAll: 'Tout effacer ({{count}})',
    sources: 'Sources Oracle',
    lastUpdated: 'Dernière mise à jour',
    confidence: 'Confiance : {{min}}%–{{max}}%',
    confidenceMin: 'Min',
    confidenceMax: 'Max',
    priceRange: 'Plage de prix',
    priceMin: 'Min',
    priceMax: 'Max',
    sortBy: 'Trier par',
    sortDefault: 'Par défaut',
    sortDirection: {
      ascending: 'Croissant',
      descending: 'Décroissant',
      ariaLabel: 'Sens de tri : {{direction}}',
    },
    updatedWithin: {
      all: 'N\'importe quand',
      '1h': '1 h',
      '6h': '6 h',
      '24h': '24 h',
      '7d': '7 j',
    },
    sort: {
      pair: 'Paire (A–Z)',
      priceHigh: 'Prix (Élevé → Bas)',
      priceLow: 'Prix (Bas → Élevé)',
      confidence: 'Confiance',
      recent: 'Dernière mise à jour',
    },
    ariaLabels: {
      minConfidence: 'Confiance minimale',
      maxConfidence: 'Confiance maximale',
      sortBy: 'Trier par',
      minPrice: 'Prix minimum',
      maxPrice: 'Prix maximum',
    },
  },

  priceCard: {
    updated: 'Mis à jour {{time}}',
    confidence: '{{value}}% confiance',
    alertSet: 'Alerte active',
    setAlert: 'Créer une alerte',
    ariaLabel: 'Voir les détails de {{pair}}',
    alertAriaLabel: 'Créer une alerte pour {{pair}}',
    confidenceTooltip:
      'La confiance reflète la cohérence du prix entre les sources oracle. 100% signifie que toutes les sources concordent exactement.',
  },

  table: {
    ariaLabel: 'Tableau des flux de prix',
    columns: {
      pair: 'Paire',
      price: 'Prix',
      confidence: 'Confiance',
      sources: 'Sources',
      updated: 'Mis à jour',
      alert: 'Alerte',
      select: 'Sélectionner',
    },
    row: {
      liveAriaLabel: 'Données en direct',
      alertAriaLabel: 'Alerte active',
      rowAriaLabel: 'Voir les détails de {{pair}}',
      alertSet: 'Alerte active',
      setAlert: 'Créer une alerte',
      alertButtonAriaLabel: 'Créer une alerte pour {{pair}}',
    },
  },

  alertModal: {
    titleNew: 'Nouvelle alerte de prix',
    titleEdit: 'Modifier l\'alerte',
    ariaLabelNew: 'Créer une alerte de prix',
    ariaLabelEdit: 'Modifier une alerte de prix',
    close: 'Fermer la fenêtre',
    fields: {
      assetPair: 'Paire d\'actifs',
      assetPairPlaceholder: 'ex. BTC/USD',
      upperThreshold: 'Seuil supérieur',
      upperPlaceholder: 'Prix maximum',
      lowerThreshold: 'Seuil inférieur',
      lowerPlaceholder: 'Prix minimum',
      triggerOnce: 'Déclencher une fois',
      triggerOnceDescription: 'L\'alerte se désactive après avoir été déclenchée',
    },
    actions: {
      delete: 'Supprimer l\'alerte',
      cancel: 'Annuler',
      save: 'Enregistrer',
      create: 'Créer l\'alerte',
    },
    validation: {
      assetPairRequired: 'La paire d\'actifs est requise',
      atLeastOneThreshold: 'Au moins un seuil est requis',
      mustBePositive: 'Doit être un nombre positif',
      upperGreaterThanLower: 'Doit être supérieur au seuil inférieur',
      lowerLessThanUpper: 'Doit être inférieur au seuil supérieur',
    },
  },

  error: {
    title: 'Une erreur s\'est produite',
    defaultMessage: 'Une erreur inattendue s\'est produite.',
    reload: 'Recharger la page',
  },

  network: {
    offline: 'Pas de connexion internet',
    offlineDetail: 'Les données peuvent être obsolètes jusqu\'à la reconnexion',
  },

  notFound: {
    heading: '404',
    message: 'Page introuvable',
    backToDashboard: 'Retour au tableau de bord',
  },

  settings: {
    title: 'Paramètres',
    close: 'Fermer les paramètres',
    sections: {
      data: 'Données',
      accessibility: 'Accessibilité',
      privacy: 'Confidentialité',
      language: 'Langue',
    },
    fields: {
      refreshInterval: 'Intervalle de rafraîchissement',
      chartTimeRange: 'Plage de temps du graphique',
      staleThreshold: 'Seuil d\'actif obsolète',
    },
    accessibility: {
      reducedMotion: 'Mouvement réduit',
      reducedMotionDesc: 'Désactive les animations pour les utilisateurs sensibles au mouvement',
      highContrast: 'Contraste élevé',
      highContrastDesc: 'Augmente le contraste des couleurs pour les malvoyants',
      largeText: 'Grand texte',
      largeTextDesc: 'Augmente la taille de la police de base dans tout le tableau de bord',
    },
    privacy: {
      enableAnalytics: 'Activer l\'analyse',
      enableAnalyticsDesc: 'Autoriser les analyses axées sur la confidentialité (désactivable).',
    },
    language: {
      label: 'Langue de l\'interface',
    },
    actions: {
      undo: 'Annuler',
      undoShortcut: 'Ctrl+Z',
      undoAriaLabel: 'Annuler la dernière modification',
      redo: 'Rétablir',
      redoShortcut: 'Ctrl+Shift+Z',
      redoAriaLabel: 'Rétablir la dernière modification annulée',
      clear: 'Effacer',
      clearAriaLabel: 'Effacer l\'historique d\'annulation',
    },
  },

  apiDocs: {
    title: 'Documentation API',
    subtitle: 'Endpoints REST et WebSocket exposés par l\'Agrégateur Oracle de Prix Stellar.',
    openSpec: 'Ouvrir la spécification OpenAPI',
    baseUrl: 'URL de base :',
    ws: 'WS :',
    tryItOut: 'Essayer',
    sending: 'Envoi…',
    copy: 'Copier',
    copied: 'Copié !',
  },
} as const

export default fr
