import { ref } from 'vue'

type Theme = 'light' | 'dark'
type Accent = 'blue' | 'green' | 'purple'

const theme = ref<Theme>(localStorage.getItem('crm_theme') === 'dark' ? 'dark' : 'light')
const savedAccent = localStorage.getItem('crm_accent')
const accent = ref<Accent>(savedAccent === 'green' || savedAccent === 'purple' ? savedAccent : 'blue')

function applyAppearance() {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  document.documentElement.dataset.accent = accent.value
}

function setTheme(value: Theme) {
  theme.value = value
  localStorage.setItem('crm_theme', value)
  applyAppearance()
}

function setAccent(value: Accent) {
  accent.value = value
  localStorage.setItem('crm_accent', value)
  applyAppearance()
}

applyAppearance()

export function useAppearance() {
  return { theme, accent, setTheme, setAccent }
}
