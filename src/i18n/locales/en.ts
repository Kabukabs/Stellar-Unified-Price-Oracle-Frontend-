const en = {
  // ── Layout ──────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    apiDocs: 'API Docs',
    toggleMenu: 'Toggle menu',
    toggleAlerts: 'Toggle price alerts',
    appName: 'Stellar Oracle',
  },
  footer: {
    text: 'Stellar Unified Price Oracle · Developer Portal & Analytics Dashboard',
  },

  // ── Dashboard page ───────────────────────────────────────────────────────
  dashboard: {
    title: 'Price Oracle Dashboard',
    subtitle: 'Aggregated from Chainlink, Redstone, Band & Reflector',
    search: {
      placeholder: 'Search by asset pair...',
      ariaLabel: 'Search by asset pair',
    },
    filter: {
      toggle: 'Filter',
      ariaLabel: 'Toggle filter panel',
    },
    select: {
      button: 'Select',
      buttonWithCount: 'Select ({{count}})',
      ariaLabel: 'Toggle selection mode',
    },
    viewToggle: {
      ariaLabel: 'View toggle',
      card: 'Card view',
      table: 'Table view',
    },
    alerts: {
      ariaLabel: 'Configure notification channels',
      title: 'Alerts',
    },
    selection: {
      count: '{{count}} selected',
      selectAll: 'Select all',
      deselectAll: 'Deselect all',
      exportCsv: 'Export CSV',
    },
    emptyState: {
      noFeeds: 'No price feeds available',
      noFeedsDetail: 'Connect to the aggregator API to see price data.',
      noResults: 'No results',
      noResultsSearch: 'No results for "{{search}}"',
      noResultsFilterHint: 'Try adjusting your filters.',
      noResultsSearchHint: 'Try a different search term.',
    },
    loadingAriaLabel: 'Loading price cards',
    feedsAriaLabel: 'Price feeds',
  },

  // ── FilterPanel ──────────────────────────────────────────────────────────
  filter: {
    title: 'Filters & Sort',
    clearAll: 'Clear all ({{count}})',
    sources: 'Oracle Sources',
    lastUpdated: 'Last Updated',
    confidence: 'Confidence: {{min}}%–{{max}}%',
    confidenceMin: 'Min',
    confidenceMax: 'Max',
    priceRange: 'Price Range',
    priceMin: 'Min',
    priceMax: 'Max',
    sortBy: 'Sort By',
    sortDefault: 'Default',
    sortDirection: {
      ascending: 'Ascending',
      descending: 'Descending',
      ariaLabel: 'Sort direction: {{direction}}',
    },
    updatedWithin: {
      all: 'Any time',
      '1h': '1 h',
      '6h': '6 h',
      '24h': '24 h',
      '7d': '7 d',
    },
    sort: {
      pair: 'Pair (A–Z)',
      priceHigh: 'Price (High → Low)',
      priceLow: 'Price (Low → High)',
      confidence: 'Confidence',
      recent: 'Last Updated',
    },
    ariaLabels: {
      minConfidence: 'Minimum confidence',
      maxConfidence: 'Maximum confidence',
      sortBy: 'Sort by',
      minPrice: 'Minimum price',
      maxPrice: 'Maximum price',
    },
  },

  // ── PriceCard ────────────────────────────────────────────────────────────
  priceCard: {
    updated: 'Updated {{time}}',
    confidence: '{{value}}% confidence',
    alertSet: 'Alert set',
    setAlert: 'Set alert',
    ariaLabel: 'View details for {{pair}}',
    alertAriaLabel: 'Set alert for {{pair}}',
    confidenceTooltip:
      'Confidence reflects how consistent the price is across oracle sources. 100% means all sources agree exactly.',
  },

  // ── PriceTableView ────────────────────────────────────────────────────────
  table: {
    ariaLabel: 'Price feeds table',
    columns: {
      pair: 'Pair',
      price: 'Price',
      confidence: 'Confidence',
      sources: 'Sources',
      updated: 'Updated',
      alert: 'Alert',
      select: 'Select',
    },
    row: {
      liveAriaLabel: 'Live data',
      alertAriaLabel: 'Active alert',
      rowAriaLabel: 'View details for {{pair}}',
      alertSet: 'Alert set',
      setAlert: 'Set alert',
      alertButtonAriaLabel: 'Set alert for {{pair}}',
    },
  },

  // ── AlertModal ────────────────────────────────────────────────────────────
  alertModal: {
    titleNew: 'New Price Alert',
    titleEdit: 'Edit Alert',
    ariaLabelNew: 'Create price alert',
    ariaLabelEdit: 'Edit price alert',
    close: 'Close modal',
    fields: {
      assetPair: 'Asset Pair',
      assetPairPlaceholder: 'e.g. BTC/USD',
      upperThreshold: 'Upper Threshold',
      upperPlaceholder: 'Max price',
      lowerThreshold: 'Lower Threshold',
      lowerPlaceholder: 'Min price',
      triggerOnce: 'Trigger once',
      triggerOnceDescription: 'Alert deactivates after being triggered',
    },
    actions: {
      delete: 'Delete Alert',
      cancel: 'Cancel',
      save: 'Save Changes',
      create: 'Create Alert',
    },
    validation: {
      assetPairRequired: 'Asset pair is required',
      atLeastOneThreshold: 'At least one threshold is required',
      mustBePositive: 'Must be a positive number',
      upperGreaterThanLower: 'Must be greater than lower threshold',
      lowerLessThanUpper: 'Must be less than upper threshold',
    },
  },

  // ── AlertPanel ────────────────────────────────────────────────────────────
  alertPanel: {
    title: 'Price Alerts',
    newBadge: '{{count}} New',
    empty: 'No alerts set yet',
    sections: {
      triggered: 'Triggered',
      active: 'Active Alerts',
      inactive: 'Inactive',
    },
    triggered: {
      justNow: 'Just now',
      priceCrossed: 'Price crossed',
      markRead: 'Mark Read',
      delete: 'Delete',
    },
    active: {
      pause: 'Pause alert',
      delete: 'Delete alert',
    },
    inactive: {
      resume: 'Resume alert',
      delete: 'Delete alert',
    },
    conditions: {
      between: 'Between ${{lower}} and ${{upper}}',
      above: '↑ Above ${{upper}}',
      below: '↓ Below ${{lower}}',
      none: 'No threshold',
    },
  },

  // ── ConnectionBadge ───────────────────────────────────────────────────────
  connection: {
    live: 'Live',
    connecting: 'Connecting',
    reconnecting: 'Reconnecting',
    offline: 'Offline',
    rateLimited: 'Rate limited',
    rateLimitedWithTimer: 'Rate limited ({{seconds}}s)',
    ariaLabel: 'WebSocket {{status}}',
    rateLimitedAriaLabel: 'API rate limited',
    tooltips: {
      connected:
        'WebSocket is connected. Price updates are streaming in real time.',
      connecting:
        'Establishing a WebSocket connection to the price feed server.',
      reconnecting:
        'The WebSocket connection was lost. Attempting to reconnect automatically.',
      disconnected:
        'WebSocket is offline. Prices are updated via REST polling only.',
      rateLimited:
        'The API is temporarily rate limited. Requests will resume after the retry window expires.',
    },
  },

  // ── ErrorBoundary ─────────────────────────────────────────────────────────
  error: {
    title: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred.',
    reload: 'Reload page',
  },

  // ── NetworkStatusBanner ───────────────────────────────────────────────────
  network: {
    offline: 'No internet connection',
    offlineDetail: 'Data may be stale until you reconnect',
  },

  // ── NotFound page ─────────────────────────────────────────────────────────
  notFound: {
    heading: '404',
    message: 'Page not found',
    backToDashboard: 'Back to Dashboard',
  },

  // ── PriceDetail page ──────────────────────────────────────────────────────
  priceDetail: {
    back: 'Back',
    backAriaLabel: 'Go back to dashboard',
    sections: {
      currentPrice: 'Current Price',
      oracleSources: 'Oracle Sources',
      priceHistory: 'Price History (Paginated)',
      importData: 'Import Price Data',
    },
    live: 'LIVE',
    confidence: '{{value}}% confidence',
    updated: 'Updated {{time}}',
    historyError: 'Failed to load price history: {{message}}',
    emptyState: {
      title: 'No price data available',
      detail: 'No price data available for this pair.',
    },
  },

  // ── CsvImportZone ─────────────────────────────────────────────────────────
  csv: {
    imported: 'CSV data imported — shown as overlay on chart',
    clear: 'Clear',
    dropOrBrowse: 'Drop a CSV file or',
    browse: 'browse',
    hint: 'Columns: timestamp, price — max 5 MB',
    uploadAriaLabel: 'Upload CSV file for price data import',
    errors: {
      tooLarge: 'File exceeds 5MB limit',
      invalidType: 'Only CSV files are supported',
      empty: 'File is empty',
      noValidRows: 'No valid rows found. Expected columns: timestamp, price',
    },
  },

  // ── ExportButton ──────────────────────────────────────────────────────────
  export: {
    button: 'Export',
    ariaLabel: 'Export data',
    exportAs: 'Export as {{format}}',
    langSelector: 'Code snippet language',
  },

  // ── SettingsPanel ─────────────────────────────────────────────────────────
  settings: {
    title: 'Settings',
    close: 'Close settings',
    sections: {
      data: 'Data',
      accessibility: 'Accessibility',
      privacy: 'Privacy',
      language: 'Language',
    },
    fields: {
      refreshInterval: 'Refresh Interval',
      chartTimeRange: 'Chart Time Range',
      staleThreshold: 'Stale Asset Threshold',
    },
    accessibility: {
      reducedMotion: 'Reduced Motion',
      reducedMotionDesc:
        'Disables animations and transitions for motion-sensitive users',
      highContrast: 'High Contrast',
      highContrastDesc: 'Increases color contrast ratios for low-vision users',
      largeText: 'Large Text',
      largeTextDesc: 'Increases base font size across the dashboard',
    },
    privacy: {
      enableAnalytics: 'Enable Analytics',
      enableAnalyticsDesc:
        'Allow privacy-focused analytics for feature usage (can be opted out).',
    },
    language: {
      label: 'Interface Language',
    },
    actions: {
      undo: 'Undo',
      undoShortcut: 'Ctrl+Z',
      undoAriaLabel: 'Undo last change',
      redo: 'Redo',
      redoShortcut: 'Ctrl+Shift+Z',
      redoAriaLabel: 'Redo last undone change',
      clear: 'Clear',
      clearAriaLabel: 'Clear undo history',
    },
  },

  // ── ApiDocs page ──────────────────────────────────────────────────────────
  apiDocs: {
    title: 'API Documentation',
    subtitle:
      'REST and WebSocket endpoints exposed by the Stellar Unified Price Oracle Aggregator.',
    openSpec: 'Open OpenAPI Spec',
    baseUrl: 'Base URL:',
    ws: 'WS:',
    tryItOut: 'Try it out',
    sending: 'Sending…',
    copy: 'Copy',
    copied: 'Copied!',
  },

  // ── Source descriptions (PriceCard tooltips) ──────────────────────────────
  sources: {
    chainlink:
      'Chainlink is a decentralised oracle network that delivers tamper-proof price data from premium data providers.',
    redstone:
      'RedStone is a modular oracle that streams signed price feeds on demand, reducing gas costs by storing data off-chain.',
    band: 'Band Protocol aggregates real-world data from multiple sources and makes it available on-chain via delegated validators.',
    reflector:
      'Reflector is a Stellar-native oracle that publishes asset prices directly on the Stellar network.',
    defaultTooltip: '{{source}} contributed a price feed to this aggregated value.',
  },
} as const

export default en
