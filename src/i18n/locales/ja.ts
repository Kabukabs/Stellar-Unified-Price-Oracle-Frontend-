const ja = {
  nav: {
    dashboard: 'ダッシュボード',
    apiDocs: 'APIドキュメント',
    toggleMenu: 'メニューを切り替え',
    toggleAlerts: '価格アラートを切り替え',
    appName: 'Stellar Oracle',
  },
  footer: {
    text: 'Stellar Unified Price Oracle · 開発者ポータル & 分析ダッシュボード',
  },

  dashboard: {
    title: '価格オラクルダッシュボード',
    subtitle: 'Chainlink、Redstone、Band、Reflectorから集計',
    search: {
      placeholder: '資産ペアで検索...',
      ariaLabel: '資産ペアで検索',
    },
    filter: {
      toggle: 'フィルター',
      ariaLabel: 'フィルターパネルを切り替え',
    },
    select: {
      button: '選択',
      buttonWithCount: '選択 ({{count}})',
      ariaLabel: '選択モードを切り替え',
    },
    viewToggle: {
      ariaLabel: '表示切り替え',
      card: 'カード表示',
      table: 'テーブル表示',
    },
    alerts: {
      ariaLabel: '通知チャネルを設定',
      title: 'アラート',
    },
    selection: {
      count: '{{count}}件選択中',
      selectAll: 'すべて選択',
      deselectAll: 'すべて解除',
      exportCsv: 'CSVエクスポート',
    },
    emptyState: {
      noFeeds: '価格フィードがありません',
      noFeedsDetail: 'アグリゲーターAPIに接続して価格データを表示してください。',
      noResults: '結果なし',
      noResultsSearch: '"{{search}}"の結果はありません',
      noResultsFilterHint: 'フィルターを調整してみてください。',
      noResultsSearchHint: '別の検索ワードをお試しください。',
    },
    loadingAriaLabel: '価格カードを読み込み中',
    feedsAriaLabel: '価格フィード',
  },

  filter: {
    title: 'フィルター & ソート',
    clearAll: 'すべてクリア ({{count}})',
    sources: 'オラクルソース',
    lastUpdated: '最終更新',
    confidence: '信頼度: {{min}}%–{{max}}%',
    confidenceMin: '最小',
    confidenceMax: '最大',
    priceRange: '価格範囲',
    priceMin: '最小',
    priceMax: '最大',
    sortBy: '並び替え',
    sortDefault: 'デフォルト',
    sortDirection: {
      ascending: '昇順',
      descending: '降順',
      ariaLabel: '並び順: {{direction}}',
    },
    updatedWithin: {
      all: 'いつでも',
      '1h': '1 時間',
      '6h': '6 時間',
      '24h': '24 時間',
      '7d': '7 日',
    },
    sort: {
      pair: 'ペア (A–Z)',
      priceHigh: '価格 (高→低)',
      priceLow: '価格 (低→高)',
      confidence: '信頼度',
      recent: '最終更新',
    },
    ariaLabels: {
      minConfidence: '最小信頼度',
      maxConfidence: '最大信頼度',
      sortBy: '並び替え',
      minPrice: '最低価格',
      maxPrice: '最高価格',
    },
  },

  priceCard: {
    updated: '{{time}}に更新',
    confidence: '{{value}}% 信頼度',
    alertSet: 'アラート設定済み',
    setAlert: 'アラートを設定',
    ariaLabel: '{{pair}}の詳細を見る',
    alertAriaLabel: '{{pair}}のアラートを設定',
    confidenceTooltip:
      '信頼度は、オラクルソース間での価格の一貫性を反映しています。100%はすべてのソースが完全に一致することを意味します。',
  },

  table: {
    ariaLabel: '価格フィードテーブル',
    columns: {
      pair: 'ペア',
      price: '価格',
      confidence: '信頼度',
      sources: 'ソース',
      updated: '更新日時',
      alert: 'アラート',
      select: '選択',
    },
    row: {
      liveAriaLabel: 'ライブデータ',
      alertAriaLabel: 'アクティブなアラート',
      rowAriaLabel: '{{pair}}の詳細を見る',
      alertSet: 'アラート設定済み',
      setAlert: 'アラートを設定',
      alertButtonAriaLabel: '{{pair}}のアラートを設定',
    },
  },

  alertModal: {
    titleNew: '新しい価格アラート',
    titleEdit: 'アラートを編集',
    ariaLabelNew: '価格アラートを作成',
    ariaLabelEdit: '価格アラートを編集',
    close: 'モーダルを閉じる',
    fields: {
      assetPair: '資産ペア',
      assetPairPlaceholder: '例: BTC/USD',
      upperThreshold: '上限しきい値',
      upperPlaceholder: '最高価格',
      lowerThreshold: '下限しきい値',
      lowerPlaceholder: '最低価格',
      triggerOnce: '一度だけトリガー',
      triggerOnceDescription: 'トリガー後にアラートが無効になります',
    },
    actions: {
      delete: 'アラートを削除',
      cancel: 'キャンセル',
      save: '変更を保存',
      create: 'アラートを作成',
    },
    validation: {
      assetPairRequired: '資産ペアは必須です',
      atLeastOneThreshold: '少なくとも1つのしきい値が必要です',
      mustBePositive: '正の数である必要があります',
      upperGreaterThanLower: '下限しきい値より大きい値を入力してください',
      lowerLessThanUpper: '上限しきい値より小さい値を入力してください',
    },
  },

  error: {
    title: 'エラーが発生しました',
    defaultMessage: '予期しないエラーが発生しました。',
    reload: 'ページを再読み込み',
  },

  network: {
    offline: 'インターネット接続なし',
    offlineDetail: '再接続するまでデータが古くなる場合があります',
  },

  notFound: {
    heading: '404',
    message: 'ページが見つかりません',
    backToDashboard: 'ダッシュボードに戻る',
  },

  settings: {
    title: '設定',
    close: '設定を閉じる',
    sections: {
      data: 'データ',
      accessibility: 'アクセシビリティ',
      privacy: 'プライバシー',
      language: '言語',
    },
    fields: {
      refreshInterval: '更新間隔',
      chartTimeRange: 'チャート時間範囲',
      staleThreshold: '古いデータのしきい値',
    },
    accessibility: {
      reducedMotion: '動きを減らす',
      reducedMotionDesc: 'アニメーションを無効にします',
      highContrast: 'ハイコントラスト',
      highContrastDesc: '低視力ユーザー向けにカラーコントラストを高めます',
      largeText: '大きいテキスト',
      largeTextDesc: 'ダッシュボード全体のフォントサイズを大きくします',
    },
    privacy: {
      enableAnalytics: '分析を有効にする',
      enableAnalyticsDesc: 'プライバシーに配慮した機能利用分析を許可します（オプトアウト可能）。',
    },
    language: {
      label: 'インターフェース言語',
    },
    actions: {
      undo: '元に戻す',
      undoShortcut: 'Ctrl+Z',
      undoAriaLabel: '最後の変更を元に戻す',
      redo: 'やり直す',
      redoShortcut: 'Ctrl+Shift+Z',
      redoAriaLabel: '最後に元に戻した変更をやり直す',
      clear: 'クリア',
      clearAriaLabel: '元に戻す履歴をクリア',
    },
  },

  apiDocs: {
    title: 'APIドキュメント',
    subtitle: 'Stellar Unified Price Oracle Aggregatorが公開するRESTおよびWebSocketエンドポイント。',
    openSpec: 'OpenAPI仕様を開く',
    baseUrl: 'ベースURL:',
    ws: 'WS:',
    tryItOut: '試してみる',
    sending: '送信中…',
    copy: 'コピー',
    copied: 'コピーしました！',
  },
} as const

export default ja
