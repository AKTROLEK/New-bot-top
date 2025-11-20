import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class I18n {
  constructor() {
    this.translations = {};
    this.defaultLanguage = config.bot.language;
  }

  async load() {
    try {
      // Load Arabic translations
      const arPath = join(__dirname, '../locales/ar.json');
      const arContent = await readFile(arPath, 'utf-8');
      this.translations.ar = JSON.parse(arContent);

      // Load English translations
      const enPath = join(__dirname, '../locales/en.json');
      const enContent = await readFile(enPath, 'utf-8');
      this.translations.en = JSON.parse(enContent);

      console.log('✅ Language files loaded successfully');
    } catch (error) {
      console.error('❌ Error loading language files:', error);
      throw error;
    }
  }

  t(key, replacements = {}, language = null) {
    const lang = language || this.defaultLanguage;
    const keys = key.split('.');
    let value = this.translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        if (lang !== 'en') {
          return this.t(key, replacements, 'en');
        }
        return key;
      }
    }

    // Replace placeholders
    if (typeof value === 'string') {
      Object.keys(replacements).forEach(placeholder => {
        value = value.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacements[placeholder]);
      });
    }

    return value;
  }

  // Get command name and description
  getCommand(commandKey, language = null) {
    const lang = language || this.defaultLanguage;
    return {
      name: this.t(`commands.${commandKey}.name`, {}, lang),
      description: this.t(`commands.${commandKey}.description`, {}, lang),
    };
  }
}

export default new I18n();
