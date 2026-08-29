import { createContext, ReactNode, useContext, useState } from 'react'

type Lang = 'pt' | 'en'

type Dict = Record<string, string>

const dicts: Record<Lang, Dict> = {
  pt: {
    'app.title': 'FRAGHOST',
    'nav.dashboard': 'Painel',
    'nav.console': 'Console',
    'nav.inventory': 'Inventário',
    'nav.settings': 'Configurações',
    'lang.label': 'Idioma',
    'dashboard.status': 'Status',
    'dashboard.running': 'Online',
    'dashboard.stopped': 'Offline',
    'dashboard.players': 'Jogadores',
    'dashboard.map': 'Mapa',
    'dashboard.start': 'Iniciar servidor',
    'dashboard.stop': 'Parar servidor',
    'console.title': 'Console do servidor',
    'console.placeholder': 'Digite um comando...',
    'console.send': 'Enviar',
    'settings.title': 'Configurações',
    'settings.serverPath': 'Pasta do servidor',
    'settings.port': 'Porta',
    'settings.gslt': 'GSLT (token da Steam)',
    'settings.save': 'Salvar',
    'settings.invalidPort': 'Porta inválida (1-65535)',
    'settings.invalidGslt': 'GSLT inválido (alfanumérico, mín. 8)',
    'inventory.title': 'Inventário',
    'inventory.known': 'Vistos anteriormente',
    'inventory.empty': 'Nenhum item',
    'inventory.loading': 'Carregando...'
  },
  en: {
    'app.title': 'FRAGHOST',
    'nav.dashboard': 'Dashboard',
    'nav.console': 'Console',
    'nav.inventory': 'Inventory',
    'nav.settings': 'Settings',
    'lang.label': 'Language',
    'dashboard.status': 'Status',
    'dashboard.running': 'Online',
    'dashboard.stopped': 'Offline',
    'dashboard.players': 'Players',
    'dashboard.map': 'Map',
    'dashboard.start': 'Start server',
    'dashboard.stop': 'Stop server',
    'console.title': 'Server console',
    'console.placeholder': 'Type a command...',
    'console.send': 'Send',
    'settings.title': 'Settings',
    'settings.serverPath': 'Server folder',
    'settings.port': 'Port',
    'settings.gslt': 'GSLT (Steam token)',
    'settings.save': 'Save',
    'settings.invalidPort': 'Invalid port (1-65535)',
    'settings.invalidGslt': 'Invalid GSLT (alphanumeric, min 8)',
    'inventory.title': 'Inventory',
    'inventory.known': 'Seen previously',
    'inventory.empty': 'No items',
    'inventory.loading': 'Loading...'
  }
}

interface I18nValue {
  t: (key: string) => string
  lang: Lang
  setLang: (l: Lang) => void
}

const I18nContext = createContext<I18nValue>({
  t: (k) => k,
  lang: 'pt',
  setLang: () => {}
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('pt')
  const t = (key: string) => dicts[lang][key] ?? key
  return <I18nContext.Provider value={{ t, lang, setLang }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}
