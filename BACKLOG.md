# 📋 Backlog — Weather App

Внутрішній список знахідок: баги, покращення, ідеї. Робочий документ, не для зовнішнього показу.
GitHub Issues лишаємо для майбутніх контрибуторів (зараз порожньо).

---

## 🚀 In next release (v1.0.1)

Сюди скидаємо те, що **вже виправлено локально** і чекає публікації. Цей список фактично стане списком змін наступного релізу.

- ✅ **fix(android):** кнопка ↻ refresh взагалі не рендерилась — у `App.js` не передавались пропси `refreshing` і `onRefresh` у `<CityHeader>`. Регресія, у чекпоінті #7 ці пропси документовані як обов'язкові. _App.js_ _(2026-05-10)_

- ✅ **fix(android):** pull-to-refresh знов конфліктував з peek HourlyChart (старий баг #7 повернувся через регресію). Прибрав RefreshControl зі зовнішніх FlatList/ScrollView у App.js, повернув всередину CityScreen ScrollView з `Platform.OS === 'ios'` guard. _App.js, components/CityScreen.js_ _(2026-05-10)_

- ✅ **fix(ui):** довгі назви міст ("Хмельницький" і т.д.) обрізалися крапками на вузьких пристроях (Galaxy S21, 384dp). Додано `adjustsFontSizeToFit` + `minimumFontScale={0.75}` у назві + `paddingHorizontal: 12` + `gap: 14` у center контейнері. _components/CityHeader.js_ _(2026-05-10)_

- ✅ **refactor(ui):** прибрав стрілки `‹ ›` з CityHeader — навігація між містами тепер тільки через свайп (як Apple Weather). Header чистіший, більше місця для довгих назв. _components/CityHeader.js, App.js_ _(2026-05-10)_

---

## 🐛 Known bugs

Знайдено, але **ще не виправлено**. Коли беремось за фікс — переносимо в "In next release" після коміту.

_Поки порожньо. Записуй сюди як знаходитимеш._

<!-- Приклад запису для копіювання:
- 🔴 **fix(ios):** при свайпі назад анімація заїкається на iPhone SE. Підозра: scaleHeight у HourlyChart. _components/HourlyChart.js_ _(2026-05-12)_
-->

---

## ✨ Improvements

Не баги, "було б краще якби...". UX-дрібниці, polish, оптимізації.

_Порожньо._

---

## 💡 Ideas

Майбутні фічі без жодного рішення робити їх чи ні. Якщо ідея дозріває до "точно треба" — переїжджає у Roadmap у чекпоінті.

_Порожньо._

---

## 📦 Формат запису

```
- 🔴/🟡/🟢 **type(area):** короткий опис. Підозрювані файли курсивом. _(YYYY-MM-DD)_
```

**Префікси типів** (повторюють conventional commits):
- `fix(android)` / `fix(ios)` / `fix(notif)` / `fix(i18n)` / `fix(ui)`
- `improve(ui)` / `improve(perf)` / `improve(a11y)`
- `feat(...)` — нова фіча

**Пріоритети:**
- 🔴 **high** — блокує користувача (краш, не запускається, не видно ключового UI)
- 🟡 **medium** — псує досвід, але можна жити
- 🟢 **low** — дрібниця, polish

---

## 🔁 Workflow коли в "In next release" набралось 3-5 пунктів

1. Перевір що ВСІ пункти закомічені і запушені на `main`. Зайди в `git log --oneline -10` і звір
2. Збілди новий APK:
   ```powershell
   eas build --profile production --platform android
   ```
3. Скачай APK з EAS dashboard (або з $env:TEMP після білду)
4. Оформи реліз:
   ```powershell
   git tag -a v1.0.1 -m "v1.0.1: bug fixes"
   git push origin v1.0.1
   ```
   GitHub Action `Release Draft` створить draft за ~17 секунд
5. На GitHub → Releases → Edit draft → drag APK у Assets → Publish
6. Почисти секцію "🚀 In next release" у цьому файлі (просто видали виправлені пункти):
   ```powershell
   git add BACKLOG.md
   git commit -m "chore: clear backlog after v1.0.1 release"
   git push
   ```

---

## 🤔 Чому окремий файл, а не GitHub Issues

- **Завжди під рукою** у VS Code (Ctrl+P → "BACKLOG")
- **Версіонується разом з кодом** — у будь-якому commit видно стан беклогу
- **Не потребує переключення на браузер**
- Issues потрібні якщо з'являться контрибутори або користувачі-репортери. Тоді — переносити з беклогу в issues, а беклог використовувати як особистий triage