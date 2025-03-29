// finance-ticker.js
class FinanceTicker {
  constructor(options = {}) {
    // 默认配置
    this.config = {
      container: options.container || '#ticker-content',
      apiKey: options.apiKey || 'd1b95aaf85b86f920dad70bb',
      refreshInterval: options.refreshInterval || 300000, // 5分钟
      assets: options.assets || [
        { type: 'crypto', symbol: 'BTCUSDT', name: '比特币' },
        { type: 'crypto', symbol: 'ETHUSDT', name: '以太坊' },
        { type: 'crypto', symbol: 'SOLUSDT', name: 'Solana' },
        { type: 'crypto', symbol: 'XRPUSDT', name: 'XRP' },
        { type: 'crypto', symbol: 'WLDUSDT', name: 'Worldcoin' },
        { type: 'forex', symbol: 'NZD', name: '新西兰元' }
      ]
    };
    
    this.intervalId = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
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

  async fetchCryptoData() {
    const requests = this.config.assets
      .filter(a => a.type === 'crypto')
      .map(async asset => {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${asset.symbol}`);
          if (!res.ok) throw new Error('API请求失败');
          const data = await res.json();
          return {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            lastPrice: parseFloat(data.lastPrice),
            priceChangePercent: parseFloat(data.priceChangePercent)
          };
        } catch (error) {
          console.error(`获取 ${asset.symbol} 数据失败:`, error);
          return this.generateFallbackData(asset);
        }
      });
    
    return Promise.all(requests);
  }

  async fetchForexData() {
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${this.config.apiKey}/latest/USD`);
      if (!res.ok) throw new Error('外汇API请求失败');
      const data = await res.json();
      
      const nzdToCny = data.conversion_rates.CNY / data.conversion_rates.NZD;
      const nzdToUsd = 1 / data.conversion_rates.NZD;
      
      return [
        this.createForexItem('NZDCYN', nzdToCny, '人民币'),
        this.createForexItem('NZDUSD', nzdToUsd, '美元')
      ];
    } catch (error) {
      console.error('获取外汇数据失败:', error);
      return [
        this.createForexItem('NZDCYN', 4.35, '人民币'),
        this.createForexItem('NZDUSD', 0.62, '美元')
      ];
    }
  }

  createForexItem(symbol, rate, currency) {
    return {
      symbol,
      name: '新西兰元',
      type: 'forex',
      lastPrice: rate,
      priceChangePercent: 0,
      displayText: `新西兰元 = ${rate.toFixed(4)} ${currency}`
    };
  }

  generateFallbackData(asset) {
    return {
      ...asset,
      lastPrice: Math.random() * 10000,
      priceChangePercent: (Math.random() * 10 - 5)
    };
  }

  updateTicker(data) {
    const container = document.querySelector(this.config.container);
    if (!container) return;

    container.innerHTML = '';
    
    // 双倍数据实现无缝滚动
    for (let i = 0; i < 2; i++) {
      data.forEach(item => {
        container.appendChild(this.createTickerItem(item));
      });
    }
    
    this.adjustAnimationSpeed();
  }

  createTickerItem(item) {
    const change = item.priceChangePercent || 0;
    const changeClass = change >= 0 ? 'price-up' : 'price-down';
    const displayContent = item.displayText || 
      `${item.name}: $${item.lastPrice.toFixed(item.lastPrice < 1 ? 4 : 2)}`;
    
    const itemElement = document.createElement('span');
    itemElement.className = `ticker-item ${item.type}`;
    itemElement.innerHTML = `
      ${displayContent}
      ${change ? `<span class="${changeClass}">(${change.toFixed(2)}%)</span>` : ''}
    `;
    
    return itemElement;
  }

  adjustAnimationSpeed() {
    const container = document.querySelector(this.config.container);
    if (!container) return;
    
    const contentWidth = container.scrollWidth / 2;
    const viewportWidth = window.innerWidth;
    let duration = 60; // 默认60秒
    
    if (contentWidth > viewportWidth * 3) duration = 100;
    else if (contentWidth > viewportWidth * 2) duration = 80;
    
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      duration *= 1.5;
    }
    
    container.style.animationDuration = `${duration}s`;
  }

  showFallbackData() {
    const fallbackData = [
      { type: 'forex', displayText: '新西兰元 = 4.3500 人民币' },
      { type: 'forex', displayText: '新西兰元 = 0.6200 美元' },
      { type: 'crypto', displayText: '比特币: $60,000.00', priceChangePercent: 2.5 },
      { type: 'crypto', displayText: '以太坊: $3,000.00', priceChangePercent: -1.2 },
      { type: 'crypto', displayText: 'Solana: $150.00', priceChangePercent: 5.8 },
      { type: 'crypto', displayText: 'XRP: $0.50', priceChangePercent: -0.5 },
      { type: 'crypto', displayText: 'Worldcoin: $2.00', priceChangePercent: 3.2 }
    ];
    
    this.updateTicker(fallbackData);
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.intervalId = setInterval(
      () => this.loadData(), 
      this.config.refreshInterval
    );
  }

  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setupEventListeners() {
    const tickerBar = document.querySelector('#crypto-ticker');
    if (!tickerBar) return;
    
    const container = document.querySelector(this.config.container);
    if (!container) return;
    
    const pauseAnimation = () => {
      container.style.animationPlayState = 'paused';
    };
    
    const resumeAnimation = () => {
      container.style.animationPlayState = 'running';
    };
    
    // 鼠标事件
    tickerBar.addEventListener('mouseenter', pauseAnimation);
    tickerBar.addEventListener('mouseleave', resumeAnimation);
    
    // 触摸事件
    tickerBar.addEventListener('touchstart', pauseAnimation);
    tickerBar.addEventListener('touchend', resumeAnimation);
    
    // 窗口大小变化
    window.addEventListener('resize', () => this.adjustAnimationSpeed());
  }

  destroy() {
    this.stopAutoRefresh();
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinanceTicker;
} else {
  window.FinanceTicker = FinanceTicker;
}
