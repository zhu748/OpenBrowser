import {R as e} from "./runtime-core.esm-bundler-CBj16o9G.js";
var t = "__prevent-mask-overlay__";
var n = document.createElement("div");
(n.id = t);
(Object.assign(n.style, { display: "none", position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0)", zIndex: "10", pointerEvents: "auto" }));
(document.body.appendChild(n));
function r() {
  e(() => {
    r2();
  });
  function t2() {
    n.style.display = "block";
  }
  function r2() {
    n.style.display = "none";
  }
  return { showPreventMask: t2, hidePreventMask: r2 };
}
export {r as t};