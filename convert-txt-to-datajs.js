const fs = require('fs');
const path = require('path');

const txt = fs.readFileSync(path.join(__dirname, 'xiaobaotong.txt'), 'utf-8');
const lines = txt.split(/\r?\n/);

const result = [];
let currentCategory = '';
let tagsMap = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // 跳过空行和统计行
  if (!line || line.startsWith('以上标签') || line.startsWith('以上 标签') || line.startsWith('以上标签') || line.startsWith('以上标签')) continue;

  // 分类切换：遇到"以上标签XX"前一段的分类
  if (line.startsWith('https://')) {
    // 读取下一行
    const info = (lines[i + 1] || '').trim();
    if (!info || info.startsWith('以上标签')) continue;

    // 解析字段
    // 专栏名称|作者|价格|订阅人数|文章数|分类
    const [title, author, price, subscribers, articles, category] = info.split('|').map(s => s.trim());
    if (!title || !author || !price || !subscribers || !articles || !category) continue;

    // 自动生成描述和标签
    const description = `${title}，由${author}出品，分类：${category}。`;
    const tags = [category, ...title.split(/[\s··：:（）\(\)\[\]\-]/).filter(Boolean).slice(0,2)];

    result.push({
      title,
      author,
      description,
      category,
      price: price.startsWith('¥') ? price : '¥' + price.replace('元', ''),
      subscribers,
      articles: articles.replace('篇', ''),
      tags,
      url: line
    });
    i++; // 跳过info行
  }
}

// 输出为 data.js
const output = 'window.LEARNING_CONTENT = ' + JSON.stringify(result, null, 2) + ';';
fs.writeFileSync(path.join(__dirname, 'data.js'), output, 'utf-8');
console.log('已生成 data.js，共', result.length, '条数据');