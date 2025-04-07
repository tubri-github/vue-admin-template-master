import VueI18n from 'vue-i18n'
import enUS from 'vxe-table/lib/locale/lang/en-US'
const messages = {
  en_US: {
    ...enUS
  }
}

const i18n = new VueI18n({
  locale: "en_US",
  messages,
})

export default i18n
