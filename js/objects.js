// Модуль для работы с объектами
// Использует LocalStorage для хранения данных

const ObjectsManager = {
  // Ключ для хранения в LocalStorage
  STORAGE_KEY: 'nulevaya_papka_objects',

  // Получить все объекты
  getAll() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Получить объект по ID
  getById(id) {
    const all = this.getAll();
    return all.find(obj => obj.id === id);
  },

  // Добавить объект
  add(objectData) {
    const all = this.getAll();

    // Генерируем ID если нет
    if (!objectData.id) {
      objectData.id = this.generateId();
    }

    // Добавляем дату создания
    objectData.createdAt = new Date().toISOString();

    all.push(objectData);
    this.save(all);
    return objectData;
  },

  // Обновить объект
  update(id, updates) {
    const all = this.getAll();
    const index = all.findIndex(obj => obj.id === id);

    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
      this.save(all);
      return all[index];
    }
    return null;
  },

  // Удалить объект
  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(obj => obj.id !== id);
    this.save(filtered);
    return filtered.length < all.length;
  },

  // Сохранить в LocalStorage
  save(objects) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(objects));
  },

  // Очистить все данные
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  // Генерировать уникальный ID
  generateId() {
    return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Получить статистику по объекту
  getStats(objectId) {
    // Подключаем модули если доступны
    if (typeof EmployeesManager !== 'undefined') {
      const employees = EmployeesManager.getAll().filter(emp => emp.objectId === objectId);
      const admitted = employees.filter(emp => emp.status === 'admitted').length;

      return {
        totalEmployees: employees.length,
        admitted: admitted,
        notAdmitted: employees.length - admitted
      };
    }

    return {
      totalEmployees: 0,
      admitted: 0,
      notAdmitted: 0
    };
  },

  // Миграция: перенести старый объект в новую структуру
  migrateFromOldStructure() {
    const oldObject = localStorage.getItem('nulevaya_papka_object');

    if (oldObject) {
      const data = JSON.parse(oldObject);
      const all = this.getAll();

      // Если массив пустой, добавляем старый объект
      if (all.length === 0) {
        this.add(data);
        console.log('Migrated old object to new structure');
      }
    }
  }
};

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObjectsManager;
}
