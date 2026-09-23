/* Runnable Go sandbox for the course.
   yaegi (a Go interpreter) compiled to WebAssembly runs a subset of Go in the browser.

   Markup (one script tag per lesson: <script src="../assets/sandbox.js"></script>):
     <div class="sandbox">
       <textarea spellcheck="false">package main
   ...your Go...
   </textarea>
     </div>
   The script adds a Run button, status line and output area to each .sandbox.

   The ~39MB wasm (~8MB brotli) is fetched lazily on the FIRST Run click, from jsDelivr
   (brotli, CDN-cached), pinned to a git tag; falls back to the local ./go-sandbox.wasm.
   Works: fmt/strings/sort/slices/maps/strconv, structs, channels, goroutines.
   Does NOT work: net/http server, pgx, redis, real parallelism -> run those with `go run`.
*/
(function () {
  var thisScript = document.currentScript;
  var base = thisScript ? thisScript.src.replace(/[^/]*$/, "") : "";

  // Pinned CDN build (brotli). Bump the tag when go-sandbox.wasm is rebuilt.
  var TAG = "go-sandbox-v1";
  var CDN = "https://cdn.jsdelivr.net/gh/stoyanovk/go-course@" + TAG + "/assets/go-sandbox.wasm";
  var LOCAL = base + "go-sandbox.wasm";

  var runGoPromise = null; // memoized loader

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error("load " + src)); };
      document.head.appendChild(s);
    });
  }

  async function instantiateFrom(url, importObject) {
    var resp = await fetch(url);
    if (!resp.ok) throw new Error("fetch " + url + " -> " + resp.status);
    var buf = await resp.arrayBuffer();
    return (await WebAssembly.instantiate(buf, importObject)).instance;
  }

  function ensureGo(onProgress) {
    if (runGoPromise) return runGoPromise;
    runGoPromise = (async function () {
      if (typeof Go === "undefined") await loadScript(base + "wasm_exec.js");
      var go = new Go();
      var instance;
      try {
        instance = await instantiateFrom(CDN, go.importObject);
      } catch (e) {
        if (onProgress) onProgress("CDN недоступен, беру локальный файл…");
        instance = await instantiateFrom(LOCAL, go.importObject);
      }
      go.run(instance); // starts main(), registers window.runGo, then yields
      for (var i = 0; i < 250 && typeof window.runGo !== "function"; i++) {
        await new Promise(function (r) { setTimeout(r, 20); });
      }
      if (typeof window.runGo !== "function") throw new Error("runGo не зарегистрировался");
      return window.runGo;
    })();
    return runGoPromise;
  }

  function initSandbox(el) {
    var ta = el.querySelector("textarea");
    if (!ta) return;
    var initial = ta.value.replace(/^\n/, "");
    ta.value = initial;
    // grow textarea to its content
    ta.rows = Math.max(6, initial.split("\n").length + 1);

    // Tab inserts two spaces; Cmd/Ctrl+Enter runs.
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2;
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault(); run();
      }
    });

    var bar = document.createElement("div");
    bar.className = "sandbox-bar";
    var runBtn = document.createElement("button");
    runBtn.className = "run"; runBtn.type = "button"; runBtn.textContent = "▶ Запустить";
    var resetBtn = document.createElement("button");
    resetBtn.className = "reset"; resetBtn.type = "button"; resetBtn.textContent = "↺ Сброс";
    var status = document.createElement("span");
    status.className = "status";
    bar.appendChild(runBtn); bar.appendChild(resetBtn); bar.appendChild(status);

    var out = document.createElement("pre");
    out.className = "sandbox-out"; out.hidden = true;

    el.appendChild(bar); el.appendChild(out);

    resetBtn.addEventListener("click", function () {
      ta.value = initial; out.hidden = true; out.textContent = ""; status.textContent = "";
    });
    runBtn.addEventListener("click", run);

    async function run() {
      out.hidden = false; out.textContent = ""; runBtn.disabled = true;
      status.textContent = "загружаю Go-песочницу (~8 МБ, один раз)…";
      try {
        var runGo = await ensureGo(function (m) { status.textContent = m; });
        status.textContent = "выполняю…";
        // give the browser a paint frame before the (sync) interpret call
        await new Promise(function (r) { requestAnimationFrame(function () { r(); }); });
        var res = window.runGo(ta.value);
        var text = res.out || "";
        if (res.err) text += (text ? "\n" : "") + "⚠ " + res.err;
        out.textContent = text || "(программа ничего не вывела)";
        status.textContent = res.err ? "с ошибкой" : "готово ✓";
      } catch (e) {
        out.textContent =
          "Не удалось загрузить песочницу: " + e.message +
          "\n\nЗапусти локально: сохрани в main.go и выполни  go run main.go";
        status.textContent = "оффлайн";
      } finally {
        runBtn.disabled = false;
      }
    }
  }

  function boot() {
    var nodes = document.querySelectorAll(".sandbox");
    for (var i = 0; i < nodes.length; i++) initSandbox(nodes[i]);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
