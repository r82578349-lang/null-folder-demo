// Модуль для работы с сотрудниками
// Использует LocalStorage для хранения данных

const EmployeesManager = {
  // Ключ для хранения в LocalStorage
  STORAGE_KEY: 'nulevaya_papka_employees',

  // Получить всех сотрудников
  getAll() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Получить сотрудников по объекту
  getByObject(objectId) {
    const all = this.getAll();
    return all.filter(emp => emp.objectId === objectId);
  },

  // Получить сотрудника по ID
  getById(id) {
    const all = this.getAll();
    return all.find(emp => emp.id === id);
  },

  // Добавить сотрудника
  add(employee) {
    const all = this.getAll();

    // Генерируем ID если нет
    if (!employee.id) {
      employee.id = this.generateId();
    }

    // Добавляем дату создания
    employee.createdAt = new Date().toISOString();

    all.push(employee);
    this.save(all);
    return employee;
  },

  // Добавить несколько сотрудников (массовая загрузка)
  addBulk(employees) {
    const all = this.getAll();
    const added = [];

    employees.forEach(emp => {
      if (!emp.id) {
        emp.id = this.generateId();
      }
      emp.createdAt = new Date().toISOString();
      all.push(emp);
      added.push(emp);
    });

    this.save(all);
    return added;
  },

  // Обновить сотрудника
  update(id, updates) {
    const all = this.getAll();
    const index = all.findIndex(emp => emp.id === id);

    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
      this.save(all);
      return all[index];
    }
    return null;
  },

  // Удалить сотрудника
  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(emp => emp.id !== id);
    this.save(filtered);
    return filtered.length < all.length;
  },

  // Сохранить в LocalStorage
  save(employees) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(employees));
  },

  // Очистить все данные
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  // Генерировать уникальный ID
  generateId() {
    return 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Экспорт в CSV
  exportToCSV() {
    const employees = this.getAll();
    if (employees.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Заголовки
    const headers = [
      '№ п/п',
      'ФИО (полностью)',
      'Тип',
      'Гражданство',
      'Дата рождения',
      'Должность (профессия)',
      'Патент Серия/№',
      'Вид документа',
      'Кем выдан',
      'Дата выдачи',
      'Действителен до',
      'Примечание'
    ];

    // Формируем CSV
    let csv = headers.join(';') + '\n';

    employees.forEach((emp, index) => {
      const row = [
        index + 1,
        emp.fullName || '',
        emp.type || 'Рабочий',
        emp.citizenship || 'РФ',
        emp.birthDate || '',
        emp.position || '',
        emp.patent?.number || '',
        emp.patent?.type || '',
        emp.patent?.issuedBy || '',
        emp.patent?.issueDate || '',
        emp.patent?.validUntil || '',
        emp.notes || ''
      ];
      csv += row.join(';') + '\n';
    });

    // Скачиваем файл
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Список_работников_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Импорт из Excel (используя библиотеку SheetJS)
  importFromExcel(file, callback) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Берём первый лист
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Конвертируем в JSON (начиная со строки с данными)
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          range: 17, // Начинаем с 18-й строки (после заголовков)
          header: ['num', 'fullName', 'type', 'citizenship', 'birthDate', 'position', 'patentNumber', 'patentType', 'patentIssuedBy', 'patentIssueDate', 'patentValidUntil', 'notes'],
          defval: ''
        });

        // Фильтруем пустые строки и форматируем
        const employees = jsonData
          .filter(row => row.fullName && row.fullName.trim() !== '')
          .map(row => ({
            fullName: row.fullName,
            type: row.type || 'Рабочий',
            citizenship: row.citizenship || 'РФ',
            birthDate: this.formatDate(row.birthDate),
            position: row.position,
            patent: (row.patentNumber || row.patentType) ? {
              number: row.patentNumber,
              type: row.patentType,
              issuedBy: row.patentIssuedBy,
              issueDate: this.formatDate(row.patentIssueDate),
              validUntil: this.formatDate(row.patentValidUntil)
            } : null,
            notes: row.notes,
            objectId: null // Будет назначен позже
          }));

        callback(null, employees);
      } catch (error) {
        callback(error, null);
      }
    };

    reader.onerror = (error) => {
      callback(error, null);
    };

    reader.readAsArrayBuffer(file);
  },

  // Форматирование даты из Excel
  formatDate(excelDate) {
    if (!excelDate) return '';

    // Если уже строка в формате дд.мм.гггг
    if (typeof excelDate === 'string' && excelDate.includes('.')) {
      return excelDate;
    }

    // Если Excel serial date
    if (typeof excelDate === 'number') {
      const date = XLSX.SSF.parse_date_code(excelDate);
      return `${String(date.d).padStart(2, '0')}.${String(date.m).padStart(2, '0')}.${date.y}`;
    }

    return excelDate.toString();
  },

  // Получить статистику
  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      byObject: this.groupByObject(all),
      byCitizenship: this.groupByCitizenship(all),
      withPatent: all.filter(emp => emp.patent).length
    };
  },

  groupByObject(employees) {
    const grouped = {};
    employees.forEach(emp => {
      const objId = emp.objectId || 'unassigned';
      grouped[objId] = (grouped[objId] || 0) + 1;
    });
    return grouped;
  },

  groupByCitizenship(employees) {
    const grouped = {};
    employees.forEach(emp => {
      const citizenship = emp.citizenship || 'РФ';
      grouped[citizenship] = (grouped[citizenship] || 0) + 1;
    });
    return grouped;
  }
};

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmployeesManager;
}
