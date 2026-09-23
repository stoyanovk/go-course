# Курс Go — от синтаксиса до production

Практический курс Go для фулстека, который переходит к бэкенду (уже пишет серверы на
Node и Python). Цель — писать боевой HTTP-сервис на Go: идиоматично, с конкурентностью,
Postgres, Redis, тестами и архитектурой.

**Открыть:** https://stoyanovk.github.io/go-course/

## Практика в браузере
В ранних уроках Go **запускается прямо на странице** — это интерпретатор
[yaegi](https://github.com/traefik/yaegi), скомпилированный в WebAssembly. Работает
подмножество языка (fmt/strings/sort/slices/maps, структуры, каналы, горутины). Где
браузер не тянет по-настоящему (реальный `net/http`-сервер, `pgx`, redis) — код
запускается локально через `go run`.

## Структура
- `index.html` — главная, карта из 9 этапов в 3 блоках.
- `lessons/` — уроки (`NNNN-*.html`).
- `reference/` — `syllabus.html` (программа), `glossary.html` (термины, источник истины).
- `assets/` — `styles.css`, `quiz.js` (квизы), `sandbox.js` + `go-sandbox.wasm` +
  `wasm_exec.js` (запускаемый Go), `sandbox-src/` (исходник интерпретатора для пересборки).

## Программа
Блок A — язык (1 синтаксис · 2 идиоматика · 3 конкурентность) →
Блок B — сервис (4 HTTP · 5 Postgres · 6 Redis) →
Блок C — инженерия (7 тесты · 8 архитектура · 9 production).

## Пересборка песочницы
```bash
cd assets/sandbox-src
GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../go-sandbox.wasm .
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ../wasm_exec.js   # версия должна совпадать
```
Сайт статический — GitHub Pages из ветки `main`, папка `/`. Большой `.wasm` отдаётся
через jsDelivr (brotli), URL в `sandbox.js` запинен на git-тег.
