// finance-ticker.js
class FinanceTicker {
  constructor(options = {}) {
    this.config = {
      container: options.container || '#ticker-content',
      apiKey: options.apiKey || 'd1b95aaf85b86f920dad70bb',
      refreshInterval: options.refreshInterval || 300000,
      assets: options.assets || [
        { type: 'crypto', symbol: 'BTCUSDT', name: '比特币' },
        { type: 'crypto', symbol: 'ETHUSDT', name: '以太坊' },
        { type: 'crypto', symbol: 'SOLUSDT', name: 'Solana' },
        { type: 'crypto', symbol: 'XRPUSDT', name: 'XRP' },
        { type: 'crypto', symbol: 'WLDUSDT', name: 'Worldcoin' },
        { type: 'forex', symbol: 'NZD', name: '新西兰元' }
      ]
    };
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  async loadData() {
    try {
      const [cryptoData, forexData] = await Promise.all([
        this.fetchCryptoData(),
        this.fetchForexData()
      ]);
      this.updateTicker([...cryptoData, ...forexData]);
    } catch (error) {
      console.error('金融数据加载失败:', error);
      this.showFallbackData();
    }
  }

  // ... 保持之前的所有FinanceTicker方法不变 ...
  // 包括fetchCryptoData, fetchForexData, updateTicker等方法
}

// 自动注册到全局
window.FinanceTicker = FinanceTicker;
