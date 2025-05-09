// focusData.js - 专注数据模型
// 存储用户的专注时间记录，用于生成专注热力图

// 专注记录数组
const focusData = [];

// 导出方法供其他模块使用
module.exports = {
  // 获取所有专注数据记录
  all: focusData,
  
  // 添加一条专注记录
  // 参数：
  // - date: 日期对象或ISO字符串，表示专注的日期
  // - startTime: 开始时间（毫秒时间戳或ISO字符串）
  // - duration: 持续时间（分钟）
  // - completed: 是否完成（布尔值）
  // - task: 任务名称（可选，字符串）
  add: function(date, startTime, duration, completed, task = '') {
    const record = {
      id: Date.now(), // 使用时间戳作为唯一ID
      date: date instanceof Date ? date.toISOString() : date,
      startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
      duration: duration,
      completed: completed,
      task: task
    };
    
    focusData.push(record);
    return record;
  },
  
  // 获取指定日期范围内的专注记录
  // 开始日期和结束日期都是可选的
  getByDateRange: function(startDate, endDate) {
    // 如果没有指定日期范围，返回所有记录
    if (!startDate && !endDate) {
      return [...focusData];
    }
    
    // 将日期字符串转换为Date对象进行比较
    const start = startDate ? new Date(startDate) : new Date(0); // 从1970年开始
    const end = endDate ? new Date(endDate) : new Date(); // 到现在
    
    return focusData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });
  },
  
  // 获取指定日期的专注记录
  getByDate: function(date) {
    const targetDate = date instanceof Date ? date : new Date(date);
    // 只比较年、月、日
    const targetDateString = targetDate.toISOString().split('T')[0];
    
    return focusData.filter(record => {
      const recordDateString = new Date(record.date).toISOString().split('T')[0];
      return recordDateString === targetDateString;
    });
  },
  
  // 删除指定ID的专注记录
  remove: function(id) {
    const index = focusData.findIndex(record => record.id === id);
    if (index !== -1) {
      const removed = focusData.splice(index, 1)[0];
      return removed;
    }
    return null;
  },
  
  // 清空所有专注记录
  clear: function() {
    focusData.length = 0;
  },
  
  // 获取统计数据
  getStats: function(startDate, endDate) {
    const records = this.getByDateRange(startDate, endDate);
    
    // 计算总专注次数和总时长
    const totalSessions = records.length;
    const totalMinutes = records.reduce((sum, record) => sum + record.duration, 0);
    const completedSessions = records.filter(record => record.completed).length;
    
    // 按日期分组计算每日专注次数
    const dailyStats = {};
    
    records.forEach(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      
      if (!dailyStats[recordDate]) {
        dailyStats[recordDate] = {
          date: recordDate,
          count: 0,
          minutes: 0,
          completed: 0
        };
      }
      
      dailyStats[recordDate].count += 1;
      dailyStats[recordDate].minutes += record.duration;
      if (record.completed) {
        dailyStats[recordDate].completed += 1;
      }
    });
    
    return {
      totalSessions,
      totalMinutes,
      completedSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      dailyStats: Object.values(dailyStats)
    };
  },
  
  // 获取热力图数据
  getHeatmapData: function(startDate, endDate) {
    const stats = this.getStats(startDate, endDate);
    
    // 转换成热力图需要的格式
    return stats.dailyStats.map(day => ({
      date: day.date,
      count: day.count,
      value: day.minutes // 使用专注分钟数作为热力图的值
    }));
  }
}; 