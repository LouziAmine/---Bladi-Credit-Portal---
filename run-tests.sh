#!/usr/bin/env bash
set -euo pipefail

APP_PORT=4200
PREVIEW_PORT=4300
APP_PID=""

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

print_menu() {
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║     Credit Bladi UI — Dev Launcher       ║${NC}"
    echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}1)${NC} Unit tests    — Vitest                ${GREEN}(no app needed)${NC}"
    echo -e "  ${CYAN}2)${NC} Playwright    — Integration/E2E tests ${YELLOW}(app starts automatically)${NC}"
    echo -e "  ${CYAN}3)${NC} Lighthouse CI — Performance tests      ${YELLOW}(app auto-managed)${NC}"
    echo -e "  ${CYAN}4)${NC} P + L         — Playwright then Lighthouse ${YELLOW}(app auto-managed)${NC}"
    echo -e "  ${CYAN}5)${NC} ESLint        — Style & SAST           ${BLUE}(no app needed)${NC}"
    echo -e "  ${CYAN}6)${NC} Start app     — DEV mode                ${GREEN}(ng serve on :${APP_PORT})${NC}"
    echo -e "  ${CYAN}7)${NC} npm audit / audit-ci — SCA scan        ${BLUE}(no app needed)${NC}"
    echo -e "  ${CYAN}8)${NC} ZAP           — OWASP DAST scan         ${RED}(requires preview server · Docker)${NC}"
    echo -e "  ${CYAN}q)${NC} Quit"
    echo ""
}

app_is_running() {
    nc -z localhost "$APP_PORT" 2>/dev/null
}

preview_is_running() {
    nc -z localhost "$PREVIEW_PORT" 2>/dev/null
}

backend_is_running() {
    nc -z localhost 8080 2>/dev/null
}

start_app_background() {
    if app_is_running; then
        success "App already running on :${APP_PORT} — skipping start."
        return 0
    fi

    info "Starting Credit-Bladi UI on :${APP_PORT} ..."

    npm start -q &
    APP_PID=$!

    local max_wait=60
    local elapsed=0
    while ! app_is_running; do
        if ! kill -0 "$APP_PID" 2>/dev/null; then
            error "App process died unexpectedly — check the logs."
            exit 1
        fi
        if [ $elapsed -ge $max_wait ]; then
            error "App did not start within ${max_wait}s — aborting."
            stop_app
            exit 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -ne "  Waiting for app... ${elapsed}s / ${max_wait}s\r"
    done
    echo ""
    success "App is UP on :${APP_PORT}"
}

stop_app() {
    if [ -n "$APP_PID" ]; then
        info "Stopping app (PID $APP_PID)..."
        kill "$APP_PID" 2>/dev/null || true
        wait "$APP_PID" 2>/dev/null || true
        APP_PID=""
        success "App stopped."
    fi
}

warn_if_backend_down() {
    if ! backend_is_running; then
        warn "Backend API (Credit-Bladi, :8080) is NOT running — auth-dependent specs will be skipped."
        warn "Start it from the backend repo:  ./run-tests.sh  →  option 6"
    fi
}

run_unit_tests() {
    echo ""
    info "Running unit tests (Vitest) with coverage..."
    echo ""
    npm run test:coverage

    REPORT="$(pwd)/coverage/index.html"
    echo ""
    success "Unit tests done."

    if [ -f "$REPORT" ]; then
        echo ""
        echo -e "  ${CYAN}Coverage report:${NC} file://${REPORT}"
        echo -ne "  Open in browser? [y/N] "
        read -r open_answer
        if [[ "$open_answer" =~ ^[Yy]$ ]]; then
            xdg-open "$REPORT" 2>/dev/null || open "$REPORT" 2>/dev/null || \
                warn "Cannot open browser — navigate to: file://${REPORT}"
        fi
    fi
}

run_playwright() {
    echo ""
    warn_if_backend_down
    info "Running Playwright integration/E2E tests..."
    echo -e "  ${YELLOW}(Angular dev server starts automatically via playwright.config.ts)${NC}"
    echo ""
    npm run test:e2e
    success "Playwright tests done. Report: playwright-report/index.html"
    echo -e "  ${CYAN}Report:${NC} file://$(pwd)/playwright-report/index.html"
}

run_lighthouse() {
    echo ""
    info "Running Lighthouse CI performance/quality gate..."
    echo -e "  ${YELLOW}(production build served automatically via lighthouserc.js)${NC}"
    echo ""
    npm run test:perf
    success "Lighthouse CI done. Report: lighthouse-report/"

    if [ -f "lighthouse-report/manifest.json" ] && command -v jq &>/dev/null; then
        REP_REPORTS=$(jq -r '.[] | select(.isRepresentativeRun==true) | .htmlPath' lighthouse-report/manifest.json)
        if [ -n "$REP_REPORTS" ]; then
            echo -e "  ${CYAN}Reports:${NC}"
            while IFS= read -r report; do
                echo -e "    file://${report}"
            done <<< "$REP_REPORTS"
        fi
    fi
}

run_playwright_then_lighthouse() {
    run_playwright
    echo ""
    run_lighthouse
}

run_lint() {
    echo ""
    info "Running ESLint — Angular style rules + eslint-plugin-security (SAST)..."
    echo ""
    npm run lint
    success "Lint passed — style and SAST checks are clean."
}

start_app_dev() {
    echo ""
    info "Starting Credit-Bladi UI in DEV mode..."
    echo ""
    echo -e "  ${CYAN}Port     :${NC} http://localhost:${APP_PORT}"
    echo -e "  ${CYAN}API      :${NC} ${YELLOW}requires the backend running separately on :8080${NC}"
    echo ""
    echo -e "  ${YELLOW}Press Ctrl+C to stop the app.${NC}"
    echo ""

    npm start
}

run_sca() {
    echo ""
    info "Running npm audit / audit-ci — scanning production dependencies for known CVEs..."
    echo -e "  ${YELLOW}(devDependency-only findings are excluded — they never reach the shipped bundle)${NC}"
    echo ""
    npm run test:security:sca
    success "SCA scan passed — no high/critical CVEs in production dependencies."
}

check_docker_permissions() {
    if ! command -v docker &>/dev/null; then
        error "Docker is required to run ZAP. Install Docker and retry."
        return 1
    fi

    if docker info &>/dev/null; then
        return 0
    fi

    if getent group docker &>/dev/null && id -nG "$USER" 2>/dev/null | grep -qw docker; then
        error "Docker is installed but this shell session cannot reach the daemon."
        echo -e "  ${YELLOW}Your user is in the 'docker' group but this session hasn't picked it up yet.${NC}"
        echo -e "  ${CYAN}Fix (this terminal only):${NC} run 'newgrp docker' then retry."
        echo -e "  ${CYAN}Fix (permanent):${NC} log out and back in (or reboot)."
    elif getent group docker &>/dev/null; then
        error "Your user is not in the 'docker' group."
        echo -e "  ${CYAN}Fix:${NC} sudo usermod -aG docker \$USER   (then log out and back in)"
    else
        error "Cannot connect to Docker daemon — is it installed and running?"
        echo -e "  ${YELLOW}Try:${NC} sudo systemctl status docker"
    fi
    return 1
}

start_preview_for_zap() {
    if preview_is_running; then
        success "Preview server already running on :${PREVIEW_PORT} — skipping start."
        return 0
    fi

    info "Building production bundle and starting the preview server on :${PREVIEW_PORT} ..."
    warn "Binding to 0.0.0.0 so the ZAP container can reach it — reachable from your"
    warn "whole network while the scan runs."

    npm run build -q
    HOST=0.0.0.0 PORT="$PREVIEW_PORT" node tools/preview-server.mjs &
    APP_PID=$!

    local max_wait=60
    local elapsed=0
    while ! preview_is_running; do
        if ! kill -0 "$APP_PID" 2>/dev/null; then
            error "Preview server died unexpectedly — check the logs."
            exit 1
        fi
        if [ $elapsed -ge $max_wait ]; then
            error "Preview server did not start within ${max_wait}s — aborting."
            stop_app
            exit 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -ne "  Waiting for preview server... ${elapsed}s / ${max_wait}s\r"
    done
    echo ""
    success "Preview server is UP on :${PREVIEW_PORT}"
}

run_zap() {
    echo ""
    if ! check_docker_permissions; then
        return 1
    fi
    if preview_is_running; then
        warn "Preview server is running on :${PREVIEW_PORT} — make sure it was started with"
        warn "HOST=0.0.0.0, or the ZAP container won't be able to reach it."
    else
        warn "Preview server is NOT running on :${PREVIEW_PORT}"
        echo -ne "  Build and start it automatically? [y/N] "
        read -r answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            start_preview_for_zap
            trap stop_app EXIT
        else
            error "Please build and start it first, bound for the scan:"
            error "  npm run build && HOST=0.0.0.0 node tools/preview-server.mjs"
            return 1
        fi
    fi
    info "Running OWASP ZAP DAST scan (config: security/zap-automation.yaml)..."
    echo -e "  ${YELLOW}(active scan is intrusive — only run against this local/dev instance)${NC}"
    echo ""
    local zap_status=0
    ./security/run-zap-scan.sh || zap_status=$?
    if [[ $zap_status -eq 0 ]]; then
        success "ZAP scan done. Report: security/zap-report.html"
    else
        warn "ZAP scan finished with warnings/findings (exit code ${zap_status}). Report: security/zap-report.html"
    fi
    echo -e "  ${CYAN}file://$(cd "$(dirname "$0")" && pwd)/security/zap-report.html${NC}"
}

print_menu
echo -ne "  Choose [1/2/3/4/5/6/7/8/q]: "
read -r choice

case "$choice" in
    1) run_unit_tests               ;;
    2) run_playwright                ;;
    3) run_lighthouse                ;;
    4) run_playwright_then_lighthouse ;;
    5) run_lint                      ;;
    6) start_app_dev                 ;;
    7) run_sca                       ;;
    8) run_zap                       ;;
    q|Q) info "Bye."; exit 0 ;;
    *) error "Invalid choice: '$choice'"; exit 1 ;;
esac