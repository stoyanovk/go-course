//go:build js && wasm

// Go sandbox for the course: yaegi (a Go interpreter) compiled to WebAssembly.
// Exposes window.runGo(src) -> {out, err}. Runs a subset of Go fully in the browser:
// fmt/strings/sort/slices/maps/strconv, structs, channels, goroutines (cooperative).
// It does NOT run real networking (net/http server), pgx or redis — those need a real
// machine (go run). Build:
//   GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../go-sandbox.wasm .
package main

import (
	"bytes"
	"fmt"
	"syscall/js"
	"time"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

func runGo(this js.Value, args []js.Value) interface{} {
	if len(args) == 0 {
		return js.ValueOf(map[string]interface{}{"out": "", "err": "no source provided"})
	}
	src := args[0].String()

	var buf bytes.Buffer
	res := map[string]interface{}{"out": "", "err": ""}

	done := make(chan error, 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				done <- fmt.Errorf("panic: %v", r)
			}
		}()
		i := interp.New(interp.Options{Stdout: &buf, Stderr: &buf})
		if e := i.Use(stdlib.Symbols); e != nil {
			done <- fmt.Errorf("stdlib: %w", e)
			return
		}
		_, e := i.Eval(src)
		done <- e
	}()

	select {
	case e := <-done:
		res["out"] = buf.String()
		if e != nil {
			res["err"] = e.Error()
		}
	case <-time.After(5 * time.Second):
		res["out"] = buf.String()
		res["err"] = "timeout: программа выполнялась дольше 5 секунд (бесконечный цикл?)"
	}
	return js.ValueOf(res)
}

func main() {
	js.Global().Set("runGo", js.FuncOf(runGo))
	js.Global().Get("console").Call("log", "go-sandbox: yaegi wasm ready")
	select {}
}
