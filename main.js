// main.js
const data = window.LEARNING_CONTENT;
const cardGrid = document.getElementById('cardGrid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');

let currentCategory = '全部';
let currentSearch = '';

const getAllCategories = () => {
  const cats = new Set();
  data.forEach(item => cats.add(item.category));
  return ['全部', ...Array.from(cats)];
};

const renderCategoryFilters = () => {
  const cats = getAllCategories();
  categoryFilters.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === currentCategory ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      currentCategory = cat;
      renderCategoryFilters();
      renderCards();
    };
    categoryFilters.appendChild(btn);
  });
};

const filterData = () => {
  const search = currentSearch.trim().toLowerCase();
  if (search) {
    // 有关键词时，全局搜索所有内容
    return data.filter(item => {
      const inTitle = item.title.toLowerCase().includes(search);
      const inAuthor = item.author.toLowerCase().includes(search);
      const inDesc = (item.description || '').toLowerCase().includes(search);
      const inTags = (item.tags || []).some(tag => tag.toLowerCase().includes(search));
      const inCat = (item.category || '').toLowerCase().includes(search);
      return inTitle || inAuthor || inDesc || inTags || inCat;
    });
  } else {
    // 无关键词时，按分类过滤
    return data.filter(item => currentCategory === '全部' || item.category === currentCategory);
  }
};

const renderCards = () => {
  loading.style.display = 'block';
  cardGrid.innerHTML = '';
  setTimeout(() => {
    const filtered = filterData();
    if (filtered.length === 0) {
      cardGrid.innerHTML = '<div style="color:#888;text-align:center;width:100%">未找到相关内容</div>';
    } else {
      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = e => {
          window.open(item.url, '_blank');
        };
        card.innerHTML = `
          <div class="card-title">${item.title}</div>
          <div class="card-author">作者：${item.author}</div>
          <div class="card-desc">${item.description || ''}</div>
          <div class="card-meta">
            <span>价格：${item.price}</span>
            <span>订阅：${item.subscribers}</span>
            <span>文章：${item.articles}</span>
            <span>分类：${item.category}</span>
          </div>
          <div class="card-tags">
            ${(item.tags || []).map(tag => `<span class="card-tag">${tag}</span>`).join('')}
          </div>
        `;
        cardGrid.appendChild(card);
      });
    }
    loading.style.display = 'none';
  }, 200); // 模拟加载动画
};

searchInput.addEventListener('input', e => {
  currentSearch = e.target.value;
  renderCards();
});

window.onload = () => {
  renderCategoryFilters();
  renderCards();
};

// 二维码浮动按钮与弹窗逻辑
const qrcodeFab = document.getElementById('qrcode-fab');
const qrcodeModal = document.getElementById('qrcode-modal');
const qrcodeClose = document.getElementById('qrcode-close');

qrcodeFab.onclick = () => {
  qrcodeModal.classList.add('active');
};
qrcodeClose.onclick = () => {
  qrcodeModal.classList.remove('active');
};
qrcodeModal.onclick = (e) => {
  if (e.target === qrcodeModal) qrcodeModal.classList.remove('active');
};

// 微信二维码弹窗逻辑
const wechatThumb = document.getElementById('footer-qrcode-thumb');
const wechatModal = document.getElementById('wechat-modal');
const wechatClose = document.getElementById('wechat-close');
const wechatText = document.querySelector('.footer-contact-text');

wechatThumb.onclick = () => { wechatModal.classList.add('active'); };
wechatText.onclick = () => { wechatModal.classList.add('active'); };
wechatClose.onclick = () => { wechatModal.classList.remove('active'); };
wechatModal.onclick = (e) => {
  if (e.target === wechatModal) wechatModal.classList.remove('active');
};