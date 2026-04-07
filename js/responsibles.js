// Модуль для работы с ответственными лицами
// Использует LocalStorage для хранения данных

const ResponsiblesManager = {
  // Ключ для хранения в LocalStorage
  STORAGE_KEY: 'nulevaya_papka_responsibles',

  // Типы ответственных
  TYPES: {
    PTO: 'pto',                    // Ответственный за производство работ (ПТО)
    OT: 'ot',                      // Ответственный за охрану труда
    PB: 'pb',                      // Ответственный за пожарную безопасность
    EB: 'eb',                      // Ответственный за электробезопасность
    VYSOTA: 'vysota',              // Ответственный за работы на высоте
    NARYAD: 'naryad',              // Ответственный за выдачу нарядов-допусков
    KOMENDANT: 'komendant',        // Комендант объекта
    INSTRUKTAZH: 'instruktazh'     // Ответственный за проведение инструктажей
  },

  // Получить всех ответственных
  getAll() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },

  // Получить ответственного по типу
  getByType(type) {
    const all = this.getAll();
    return all[type] || null;
  },

  // Назначить ответственного
  assign(type, responsibleData) {
    const all = this.getAll();

    all[type] = {
      ...responsibleData,
      type: type,
      assignedAt: new Date().toISOString()
    };

    this.save(all);
    return all[type];
  },

  // Удалить ответственного
  remove(type) {
    const all = this.getAll();
    delete all[type];
    this.save(all);
    return true;
  },

  // Обновить данные ответственного
  update(type, updates) {
    const all = this.getAll();

    if (all[type]) {
      all[type] = {
        ...all[type],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save(all);
      return all[type];
    }

    return null;
  },

  // Сохранить в LocalStorage
  save(responsibles) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(responsibles));
  },

  // Очистить все данные
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  // Получить список для отображения
  getList() {
    const all = this.getAll();
    const typeNames = {
      pto: 'Ответственный за производство работ (ПТО)',
      ot: 'Ответственный за охрану труда',
      pb: 'Ответственный за пожарную безопасность',
      eb: 'Ответственный за электробезопасность',
      vysota: 'Ответственный за работы на высоте',
      naryad: 'Ответственный за выдачу нарядов-допусков',
      komendant: 'Комендант объекта',
      instruktazh: 'Ответственный за проведение инструктажей'
    };

    return Object.keys(all).map(type => ({
      type: type,
      typeName: typeNames[type] || type,
      ...all[type]
    }));
  },

  // Проверить заполненность критичных ответственных
  checkCritical() {
    const all = this.getAll();
    const critical = ['pto', 'ot']; // Критичные для старта
    const missing = critical.filter(type => !all[type]);

    return {
      isComplete: missing.length === 0,
      missing: missing,
      total: critical.length,
      filled: critical.length - missing.length
    };
  },

  // Получить данные для приказа
  getForOrder(types = []) {
    const all = this.getAll();

    if (types.length === 0) {
      return all;
    }

    const result = {};
    types.forEach(type => {
      if (all[type]) {
        result[type] = all[type];
      }
    });

    return result;
  },

  // Экспорт в CSV
  exportToCSV() {
    const list = this.getList();

    if (list.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const headers = [
      'Тип ответственности',
      'ФИО',
      'Должность',
      'Номер приказа',
      'Дата приказа',
      'Дата назначения'
    ];

    let csv = headers.join(';') + '\n';

    list.forEach(item => {
      const row = [
        item.typeName,
        item.fullName || '',
        item.position || '',
        item.orderNumber || '',
        item.orderDate || '',
        item.assignedAt ? new Date(item.assignedAt).toLocaleDateString('ru-RU') : ''
      ];
      csv += row.join(';') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Ответственные_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiblesManager;
}
