(() => {
  "use strict";

  const MAX_DIGITS = 12;
  const valueEl = document.getElementById("value");
  const exprEl = document.getElementById("expr");
  const opButtons = document.querySelectorAll('[data-action="op"]');

  const state = {
    current: "0",
    previous: null,
    operator: null,
    overwrite: true,
    expr: "",
  };

  const isError = () => state.current === "Error";

  function compute(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default:  return b;
    }
  }

  function clean(n) {
    if (!Number.isFinite(n)) return "Error";
    return String(parseFloat(n.toPrecision(12)));
  }

  function format(str) {
    if (str === "Error" || str.includes("e")) return str;
    const negative = str.startsWith("-");
    const [int, frac] = (negative ? str.slice(1) : str).split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (negative ? "-" : "") + grouped + (frac !== undefined ? "." + frac : "");
  }

  function render() {
    const text = format(state.current);
    valueEl.textContent = text;
    valueEl.classList.toggle("long", text.length > 10 && text.length <= 14);
    valueEl.classList.toggle("xlong", text.length > 14);
    exprEl.textContent = state.expr;
    opButtons.forEach((b) =>
      b.classList.toggle("active", state.operator === b.dataset.op && state.overwrite)
    );
  }

  function reset() {
    state.current = "0";
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    state.expr = "";
  }

  function inputDigit(d) {
    if (isError()) reset();
    if (state.overwrite) {
      state.current = d;
      state.overwrite = false;
    } else if (state.current === "0") {
      state.current = d;
    } else if (state.current.replace(/[-.]/g, "").length < MAX_DIGITS) {
      state.current += d;
    }
  }

  function inputDecimal() {
    if (isError()) reset();
    if (state.overwrite) {
      state.current = "0.";
      state.overwrite = false;
    } else if (!state.current.includes(".")) {
      state.current += ".";
    }
  }

  function chooseOperator(op) {
    if (isError()) return;
    if (state.operator && !state.overwrite) {
      const result = clean(compute(state.previous, parseFloat(state.current), state.operator));
      state.current = result;
      if (result === "Error") {
        state.previous = null;
        state.operator = null;
        state.expr = "";
        state.overwrite = true;
        return;
      }
    }
    state.previous = parseFloat(state.current);
    state.operator = op;
    state.overwrite = true;
    state.expr = `${format(clean(state.previous))} ${op}`;
  }

  function equals() {
    if (isError() || !state.operator) return;
    const a = state.previous;
    const b = parseFloat(state.current);
    const result = clean(compute(a, b, state.operator));
    state.expr = `${format(clean(a))} ${state.operator} ${format(clean(b))} =`;
    state.current = result;
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
  }

  function backspace() {
    if (isError()) return reset();
    if (state.overwrite) return;
    state.current = state.current.slice(0, -1);
    if (state.current === "" || state.current === "-") {
      state.current = "0";
      state.overwrite = true;
    }
  }

  function negate() {
    if (isError() || state.current === "0") return;
    state.current = state.current.startsWith("-")
      ? state.current.slice(1)
      : "-" + state.current;
  }

  function percent() {
    if (isError()) return;
    state.current = clean(parseFloat(state.current) / 100);
    state.overwrite = true;
  }

  function handle(action, payload) {
    switch (action) {
      case "digit":     inputDigit(payload); break;
      case "decimal":   inputDecimal(); break;
      case "op":        chooseOperator(payload); break;
      case "equals":    equals(); break;
      case "clear":     reset(); break;
      case "backspace": backspace(); break;
      case "negate":    negate(); break;
      case "percent":   percent(); break;
    }
    render();
  }

  document.querySelector(".keys").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    handle(btn.dataset.action, btn.dataset.digit || btn.dataset.op);
  });

  const keyMap = { "+": "+", "-": "−", "*": "×", "x": "×", "/": "÷" };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) handle("digit", k);
    else if (k === "." || k === ",") handle("decimal");
    else if (keyMap[k]) { e.preventDefault(); handle("op", keyMap[k]); }
    else if (k === "Enter" || k === "=") { e.preventDefault(); handle("equals"); }
    else if (k === "Backspace") handle("backspace");
    else if (k === "Escape" || k === "Delete") handle("clear");
    else if (k === "%") handle("percent");
  });

  render();
})();
