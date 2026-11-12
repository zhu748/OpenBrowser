'use strict';

// Shell literals must survive spaces, quotes, dollar signs and backticks.
function shellQuote(value) { return "'" + String(value).replace(/'/g, "'\\''") + "'"; }

function buildMacLauncher({ kernelRoot, label }) {
  return `#!/bin/bash
# Env Dock shell — exec into OpenBrowser.bin so Helpers/Mach rendezvous work; Dock uses this .app icon.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REAL="\${HERE}/OpenBrowser.bin"
KERNEL_ROOT=${shellQuote(kernelRoot)}
LOG_DIR="\${HOME}/Library/Application Support/openbrowser/logs"
mkdir -p "\$LOG_DIR" 2>/dev/null || true
LOG="\${LOG_DIR}/kernel-launch.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] env=${label} $*" >>"\$LOG" 2>/dev/null || true; }

if [[ ! -e "\$REAL" ]]; then
  log "FATAL missing OpenBrowser.bin in env app"; exit 127
fi
if [[ -f "\${HERE}/libskit.dylib" ]]; then SKIT="\${HERE}/libskit.dylib"
elif [[ -f "\${KERNEL_ROOT}/libskit.dylib" ]]; then SKIT="\${KERNEL_ROOT}/libskit.dylib"
else SKIT=""; fi
TEMPLATE="\${KERNEL_ROOT}/init_template.json"
IPC_STUB="\${KERNEL_ROOT}/ipc-stub.py"

for a in "\$@"; do
  case "\$a" in
    --version|-version|--product-version)
      if [[ -n "\$SKIT" ]]; then exec env -u DYLD_INSERT_LIBRARIES DYLD_INSERT_LIBRARIES="\$SKIT" "\$REAL" --product-version
      else exec env -u DYLD_INSERT_LIBRARIES "\$REAL" --product-version; fi ;;
  esac
done

USER_DATA=""; HAS_STORE=0; HAS_BROWSER_ID=0; HAS_MOCK=0; HAS_DDE=0
for a in "\$@"; do
  case "\$a" in
    --user-data-dir=*) USER_DATA="\${a#--user-data-dir=}" ;;
    --store_data_path=*) HAS_STORE=1 ;;
    --browser_id=*) HAS_BROWSER_ID=1 ;;
    --use-mock-keychain) HAS_MOCK=1 ;;
    --do-not-de-elevate) HAS_DDE=1 ;;
  esac
done

log "launch user_data=\${USER_DATA:-} dock_app=\${HERE}/../.. args=\$#"
EXTRA=()
BROWSER_ID_VAL=""

if [[ -n "\$USER_DATA" ]]; then
  mkdir -p "\$USER_DATA" 2>/dev/null || true
  rm -f "\$USER_DATA/SingletonLock" "\$USER_DATA/SingletonCookie" "\$USER_DATA/SingletonSocket" "\$USER_DATA/DevToolsActivePort" 2>/dev/null || true
  if command -v python3 >/dev/null 2>&1; then
    BROWSER_ID_VAL=\$(python3 - "\$TEMPLATE" "\$USER_DATA/init.json" <<'PY' 2>>"\$LOG" || true
import base64, json, sys
from pathlib import Path
template, out = Path(sys.argv[1]), Path(sys.argv[2])
def load_init(path: Path):
    if not path.is_file():
        return {}
    raw = path.read_bytes().strip()
    try:
        data = base64.b64decode(raw, validate=False)
        if data[:1] == b"{":
            return json.loads(data)
    except Exception:
        pass
    try:
        if raw[:1] == b"{":
            return json.loads(raw)
    except Exception:
        pass
    return {}
init = load_init(out)
if not init and template.is_file():
    try: init = json.loads(template.read_text(encoding="utf-8"))
    except Exception: init = {}
if not isinstance(init, dict): init = {}
init["proxy"] = {}
init["async_proxy_data"] = 0
init["async_proxy_data_wait_page"] = ""
init["is_garble_dom_event_trusted"] = False
init["is_hubstudio"] = False
init["black_white_list"] = {"black_list": [], "exception_list": [], "tips": "", "type": 1}
init["local_port"] = {"type": 0, "black_list": [], "white_list": []}
init["launcher_page"] = "about:blank"
init["home_page"] = ""
init["page_info_enabled"] = False
init["address_bar_custom"] = []
init["framework_url_entry"] = {
    "password_manage": "chrome://password-manager/",
    "history": "chrome://history/",
    "extension_management": "chrome://extensions/",
    "setting": "chrome://settings/",
    "app_center": "chrome://extensions/",
}
init.setdefault("product_infos", {})["product_name"] = "OpenBrowser"
init.setdefault("sa_analysis", {})
init["sa_analysis"]["sa_product"] = "chromium"
init["sa_analysis"]["sa_productVer"] = "148.0.0.0"
init["required_enabled_extension_id_list"] = []
ipc = init.get("ipc") if isinstance(init.get("ipc"), dict) else {}
win = str(ipc.get("browser_window_name") or "").strip() or "SB171550832"
ipc = {
    "browser_window_name": win,
    "from_client": str(ipc.get("from_client") or f"/tmp/{win}"),
    "from_client_pipe": str(ipc.get("from_client_pipe") or win),
    "is_pipe": True,
    "rnclient_window_name": str(ipc.get("rnclient_window_name") or f"{win}listen"),
    "to_client": str(ipc.get("to_client") or f"/tmp/{win}listen"),
    "to_client_pipe": str(ipc.get("to_client_pipe") or f"{win}listen"),
}
init["ipc"] = ipc
cl = init.get("cmd_line") if isinstance(init.get("cmd_line"), dict) else {}
cl["remote-debugging-port"] = "0"
# Forensic audit: ensure enable-automation is never set in cmd_line
cl.pop("enable-automation", None)
init["cmd_line"] = cl
# OpenBrowser local automation: can_webdriver gates DevToolsHttpHandler (HTTP/WS)
# in HubStudio Framework (0x6071fbd/0x6072aec). Must be True for CDP without leaking to JS.
init["can_webdriver"] = True
init["allow_remote_debugging"] = True
if not init.get("token"): init["token"] = "openbrowser-token"
plain = json.dumps(init, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
out.write_bytes(base64.b64encode(plain))
print(win)
PY
)
    BROWSER_ID_VAL=\$(printf '%s\\n' "\$BROWSER_ID_VAL" | head -1 | tr -d '\\r')
    log "init window/browser_id=\${BROWSER_ID_VAL}"
  fi
  if [[ "\$HAS_STORE" -eq 0 ]]; then
    STORE=\$(python3 -c "import base64,sys; print(base64.b64encode(sys.argv[1].encode()).decode())" "\$USER_DATA" 2>>"\$LOG" || true)
    [[ -n "\${STORE:-}" ]] && EXTRA+=(--store_data_path="\$STORE")
  fi
  if [[ "\$HAS_BROWSER_ID" -eq 0 ]]; then
    [[ -z "\${BROWSER_ID_VAL:-}" ]] && BROWSER_ID_VAL="SB171550832"
    EXTRA+=(--browser_id="\$BROWSER_ID_VAL")
  fi
fi

[[ "\$HAS_MOCK" -eq 0 ]] && EXTRA+=(--use-mock-keychain)
[[ "\$HAS_DDE" -eq 0 ]] && EXTRA+=(--do-not-de-elevate)

# IPC stub detached (survives exec); next launch re-binds the same sockets
if [[ -n "\${BROWSER_ID_VAL:-}" ]] && command -v python3 >/dev/null 2>&1 && [[ -f "\$IPC_STUB" ]]; then
  # drop previous stub holders of this window name
  if command -v pkill >/dev/null 2>&1 && [[ -n "\${BROWSER_ID_VAL:-}" ]]; then
    # Anchor end so SB123 does not kill SB1234
    pkill -f "ipc-stub\\.py \${BROWSER_ID_VAL}( |$)" 2>/dev/null || true
  fi
  python3 "\$IPC_STUB" "\$BROWSER_ID_VAL" >>"\$LOG" 2>&1 &
  disown 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if [[ -S "/tmp/\${BROWSER_ID_VAL}" || -S "/tmp/\${BROWSER_ID_VAL}listen" ]]; then break; fi
    sleep 0.05
  done
  log "ipc-stub ready window=\${BROWSER_ID_VAL}"
fi

log "exec REAL (replace shell) extras=\${#EXTRA[@]}"
# exec: OpenBrowser.bin becomes this .app's main process — required for GPU/renderer Helpers
if [[ -n "\$SKIT" ]]; then
  exec env -u DYLD_INSERT_LIBRARIES DYLD_INSERT_LIBRARIES="\$SKIT" "\$REAL" "\${EXTRA[@]}" "\$@"
else
  exec env -u DYLD_INSERT_LIBRARIES "\$REAL" "\${EXTRA[@]}" "\$@"
fi
`;
}

module.exports = { buildMacLauncher };
