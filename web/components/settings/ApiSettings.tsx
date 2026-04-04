"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useChatStore } from "@/lib/store";
import {
  DEFAULT_PROVIDER_URLS,
  PROVIDERS,
  getDefaultModelForProvider,
  getModelOptions,
  getProviderHelpText,
  getProviderKeyLabel,
  getProviderKeyPlaceholder,
  isLocalProvider,
} from "@/lib/constants";
import type { ChatProvider } from "@/lib/types";
import { SettingRow, SectionHeader, Toggle } from "./SettingRow";
import { cn } from "@/lib/utils";

type ConnectionStatus = "idle" | "checking" | "ok" | "error";

export function ApiSettings() {
  const { settings, updateSettings, resetSettings } = useChatStore();
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const selectedProvider = useMemo(
    () => PROVIDERS.find((provider) => provider.id === settings.provider),
    [settings.provider]
  );

  async function checkConnection() {
    setConnectionStatus("checking");
    setLatencyMs(null);
    const start = Date.now();
    try {
      const params = new URLSearchParams({
        provider: settings.provider,
        apiUrl: settings.apiUrl,
      });
      if (settings.apiKey) {
        params.set("apiKey", settings.apiKey);
      }
      const response = await fetch(`/api/provider-health?${params.toString()}`, {
        signal: AbortSignal.timeout(5000),
      });
      setLatencyMs(Date.now() - start);
      setConnectionStatus(response.ok ? "ok" : "error");
    } catch {
      setConnectionStatus("error");
    }
  }

  function handleProviderChange(provider: ChatProvider) {
    updateSettings({
      provider,
      localMode: isLocalProvider(provider),
      apiUrl: DEFAULT_PROVIDER_URLS[provider],
      model: getDefaultModelForProvider(provider),
    });
    setConnectionStatus("idle");
    setLatencyMs(null);
  }

  const statusIcon = {
    idle: null,
    checking: <Loader2 className="h-4 w-4 animate-spin text-surface-400" />,
    ok: <CheckCircle className="h-4 w-4 text-green-400" />,
    error: <XCircle className="h-4 w-4 text-red-400" />,
  }[connectionStatus];

  const statusText = {
    idle: "Not checked",
    checking: "Checking...",
    ok: latencyMs !== null ? `Connected - ${latencyMs}ms` : "Connected",
    error: "Connection failed",
  }[connectionStatus];

  return (
    <div>
      <SectionHeader title="API & Authentication" onReset={() => resetSettings("api")} />

      <SettingRow
        label="Local mode"
        description="Route chat through a local provider by default. This keeps sensitive research traffic on the machine or LAN."
      >
        <Toggle
          checked={settings.localMode}
          onChange={(checked) => {
            const provider = checked ? "ollama" : "anthropic";
            updateSettings({
              localMode: checked,
              provider,
              apiUrl: DEFAULT_PROVIDER_URLS[provider],
              model: getDefaultModelForProvider(provider),
            });
            setConnectionStatus("idle");
            setLatencyMs(null);
          }}
        />
      </SettingRow>

      <SettingRow
        label="Provider"
        description="Select the upstream model API. OpenAI-compatible covers local gateways, proxies, and vLLM-style servers."
        stack
      >
        <select
          value={settings.provider}
          onChange={(event) => handleProviderChange(event.target.value as ChatProvider)}
          aria-label="Provider"
          className={cn(
            "w-full rounded-md border border-surface-700 bg-surface-800 px-3 py-2 text-sm",
            "text-surface-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          )}
        >
          {PROVIDERS.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
        {selectedProvider && (
          <p className="text-xs text-surface-500">{selectedProvider.description}</p>
        )}
      </SettingRow>

      <SettingRow
        label="API key"
        description={
          getProviderHelpText(settings.provider)
        }
        stack
      >
        <div className="text-xs text-surface-500">{getProviderKeyLabel(settings.provider)}</div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(event) => updateSettings({ apiKey: event.target.value })}
              placeholder={getProviderKeyPlaceholder(settings.provider)}
              aria-label="API key"
              className={cn(
                "w-full rounded-md border border-surface-700 bg-surface-800 px-3 py-1.5 pr-10 text-sm",
                "text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              )}
            />
            <button
              onClick={() => setShowKey((value) => !value)}
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 transition-colors hover:text-surface-300"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </SettingRow>

      <SettingRow
        label="API base URL"
        description="Provider endpoint. Anthropic uses the public API root. Local mode defaults to Ollama on 127.0.0.1:11434."
        stack
      >
        <input
          type="url"
          value={settings.apiUrl}
          onChange={(event) => updateSettings({ apiUrl: event.target.value })}
          placeholder={DEFAULT_PROVIDER_URLS[settings.provider]}
          aria-label="API base URL"
          className={cn(
            "w-full rounded-md border border-surface-700 bg-surface-800 px-3 py-1.5 text-sm",
            "text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
          )}
        />
      </SettingRow>

      <SettingRow
        label="Model"
        description="Select the model to use for requests with the selected provider."
        stack
      >
        <select
          value={settings.model}
          onChange={(e) => updateSettings({ model: e.target.value })}
          aria-label="Model"
          className={cn(
            "w-full rounded-md border border-surface-700 bg-surface-800 px-3 py-2 text-sm",
            "text-surface-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
          )}
        >
          {getModelOptions(settings.provider).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.id}
            </option>
          ))}
        </select>
        <p className="text-xs text-surface-500">
          {getModelOptions(settings.provider).find((m) => m.id === settings.model)?.description ?? ""}
        </p>
      </SettingRow>

      <SettingRow label="Connection status" description="Probe the selected provider without sending a chat request.">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {statusIcon}
            <span
              className={cn(
                "text-xs",
                connectionStatus === "ok" && "text-green-400",
                connectionStatus === "error" && "text-red-400",
                connectionStatus === "idle" && "text-surface-500",
                connectionStatus === "checking" && "text-surface-400"
              )}
            >
              {statusText}
            </span>
          </div>
          <button
            onClick={checkConnection}
            disabled={connectionStatus === "checking"}
            type="button"
            className={cn(
              "rounded-md border border-surface-700 px-3 py-1 text-xs transition-colors",
              "text-surface-300 hover:bg-surface-800 hover:text-surface-100",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            Check
          </button>
        </div>
      </SettingRow>

      <SettingRow label="Streaming" description="Stream responses token by token as they are generated.">
        <Toggle
          checked={settings.streamingEnabled}
          onChange={(value) => updateSettings({ streamingEnabled: value })}
        />
      </SettingRow>
    </div>
  );
}
