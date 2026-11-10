(() => {
  // scripting/carriers/normalizers.js
  var names = { cmcc: "\u4E2D\u56FD\u79FB\u52A8", unicom: "\u4E2D\u56FD\u8054\u901A", telecom: "\u4E2D\u56FD\u7535\u4FE1", broadnet: "\u4E2D\u56FD\u5E7F\u7535" };
  function endpoint(url) {
    if (typeof url !== "string") return null;
    if (/^https:\/\/m\.client\.10010\.com\/mobileService\/home\/queryUserInfoSeven\.htm(?:\?[^#]*)?$/i.test(url)) return "unicom";
    if (/^https:\/\/appfuwu\.189\.cn:9021\/query\/qryImportantData(?:\?[^#]*)?$/i.test(url)) return "telecom";
    if (/^https:\/\/(?:app|wx)\.10099\.com\.cn\/contact-web\/api\/busi\/qryUserInfo(?:\?[^#]*)?$/i.test(url)) return "broadnet";
    return null;
  }
  function number(v) {
    if (typeof v !== "number" && typeof v !== "string") return void 0;
    if (typeof v === "string" && !/^-?\d+(?:\.\d+)?$/.test(v.trim().replace(/,/g, ""))) return void 0;
    const n = Number(typeof v === "string" ? v.replace(/,/g, "") : v);
    return Number.isFinite(n) ? n : void 0;
  }
  function flow(v, unit) {
    const n = number(v);
    if (n === void 0) return void 0;
    switch (String(unit || "").trim().toUpperCase()) {
      case "TB":
      case "T":
        return n * 1024 * 1024;
      case "GB":
      case "G":
        return n * 1024;
      case "MB":
      case "M":
        return n;
      case "KB":
      case "K":
        return n / 1024;
      case "B":
        return n / 1048576;
      default:
        return void 0;
    }
  }
  function normalize(provider, json) {
    const out = { provider, fetchedAt: Date.now() };
    if (provider === "broadnet") {
      if (json?.status !== "000000") throw Error("\u5E7F\u7535\u67E5\u8BE2\u672A\u6210\u529F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u5E76\u6293\u53D6");
      const u = json?.data?.userData;
      if (!u || typeof u !== "object") throw Error("\u5E7F\u7535\u8FD4\u56DE\u7ED3\u6784\u672A\u9002\u914D");
      const fee = number(u.fee), f = number(u.flow), v = number(u.voice);
      if (fee !== void 0) out.balance = fee / 100;
      if (f !== void 0) out.flowMB = f / 1024;
      if (v !== void 0) out.voice = v;
    } else if (provider === "unicom") {
      if (json?.code !== "Y" || !Array.isArray(json?.data?.dataList)) throw Error("\u8054\u901A\u4F1A\u8BDD\u5931\u6548\u6216\u8FD4\u56DE\u7ED3\u6784\u672A\u9002\u914D");
      readUnicomExtras(out, json, null);
      for (const item of json.data.dataList) {
        const label = String(item.remainTitle || "");
        if (/已用|消费|已消费/.test(label)) continue;
        if (item.type === "fee" && String(item.unit) === "\u5143") out.balance = number(item.number);
        if (item.type === "flow" && /剩余|可用/.test(label)) out.flowMB = flow(item.number, item.unit);
        if (item.type === "voice" && /剩余|可用/.test(label) && /^(分钟|分|min)$/i.test(String(item.unit))) out.voice = number(item.number);
      }
    } else if (provider === "telecom") {
      const r = json?.responseData;
      if (r?.resultCode !== "0000" || !r.data) throw Error("\u7535\u4FE1\u4F1A\u8BDD\u5931\u6548\u6216\u8FD4\u56DE\u7ED3\u6784\u672A\u9002\u914D");
      const d = r.data;
      out.balance = number(d.balanceInfo?.indexBalanceDataInfo?.balance);
      const common = d.flowInfo?.commonFlow, all = d.flowInfo?.totalAmount;
      let f = common, n = number(common?.balance), used = number(common?.used), total = number(common?.total);
      if (n === void 0 && used !== void 0 && total !== void 0 && total >= used) n = total - used;
      out.flowScope = "general";
      if (n === void 0) {
        f = all;
        used = number(all?.used);
        total = number(all?.total);
        if (used !== void 0 && total !== void 0 && total >= used) {
          n = total - used;
          out.flowScope = "all";
        }
      }
      if (n !== void 0 && n >= 0) {
        out.flowMB = n / 1024;
        if (used !== void 0 && used >= 0) {
          out.flowUsedMB = used / 1024;
          out.flowTotalMB = (n + used) / 1024;
        } else if (total !== void 0 && total >= n) {
          out.flowTotalMB = total / 1024;
          out.flowUsedMB = (total - n) / 1024;
        }
      }
      const v = d.voiceInfo?.voiceDataInfo, voiceUsed = number(v?.used), voiceTotal = number(v?.total);
      out.voice = number(v?.balance);
      if (out.voice === void 0 && voiceUsed !== void 0 && voiceTotal !== void 0 && voiceTotal >= voiceUsed) out.voice = voiceTotal - voiceUsed;
      if (out.voice !== void 0 && voiceUsed !== void 0 && voiceUsed >= 0) {
        out.voiceUsed = voiceUsed;
        out.voiceTotal = out.voice + voiceUsed;
      } else if (out.voice !== void 0 && voiceTotal !== void 0 && voiceTotal >= out.voice) {
        out.voiceTotal = voiceTotal;
        out.voiceUsed = voiceTotal - out.voice;
      }
    } else throw Error("\u672A\u77E5\u8FD0\u8425\u5546");
    if (!["balance", "flowMB", "voice"].some((k) => Number.isFinite(out[k]))) throw Error("\u672A\u8BC6\u522B\u51FA\u53EF\u663E\u793A\u7684\u4F59\u989D\u6216\u4F59\u91CF\uFF0C\u672A\u4FDD\u5B58");
    for (const key of ["balance", "flowMB", "voice"]) if (!Number.isFinite(out[key])) delete out[key];
    return out;
  }
  function safeRequest(value) {
    if (!value || !endpoint(value.url)) return null;
    const method = String(value.method || "GET").toUpperCase();
    if (!["GET", "POST"].includes(method)) return null;
    const body = typeof value.body === "string" ? value.body : "";
    if (body.length > 262144) return null;
    if (/(?:"|&|^)(?:password|passwd|smsCode|verifyCode)(?:"|=)/i.test(body)) return null;
    const headers = {};
    const allowed = ["cookie", "authorization", "access", "token", "access-token", "x-access-token", "content-type", "user-agent", "referer", "origin", "x-requested-with"];
    Object.keys(value.headers || {}).forEach((k) => {
      if (allowed.includes(k.toLowerCase()) && typeof value.headers[k] === "string") headers[k] = value.headers[k];
    });
    return { url: value.url, method, headers, ...method === "POST" ? { body } : {} };
  }
  function cleanLabel(value) {
    return typeof value === "string" ? value.replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 160) : void 0;
  }
  function readUnicomExtras(out, fee, detail) {
    if (fee?.code === "Y" && Array.isArray(fee?.data?.dataList)) {
      for (const item of fee.data.dataList) {
        if (item.type === "point" && !/已用|已消费|已兑换/.test(String(item.remainTitle || ""))) {
          const n = number(item.number);
          if (n !== void 0 && n >= 0) out.points = n;
        }
        if (out.balance === void 0 && item.type === "fee" && item.unit === "\u5143") out.balance = number(item.number);
      }
    }
    if (!["0000", "Y"].includes(detail?.code)) return;
    const name = cleanLabel(detail.packageName);
    if (name) out.packageName = name;
    const resources = Array.isArray(detail.resources) ? detail.resources : [];
    const sms = resources.find((x) => x.type === "Sms");
    if (sms && /^(条|条数)$/.test(String(detail.canuseSmsAllUnit || ""))) {
      const n = number(sms.remainResource);
      if (n !== void 0 && n >= 0) out.sms = n;
    }
    const details = [];
    for (const group of resources) {
      if (!["Flow", "Voice", "Sms"].includes(group.type)) continue;
      for (const item of Array.isArray(group.details) ? group.details : []) {
        const name2 = cleanLabel(item.feePolicyName) || cleanLabel(item.addUpItemName);
        if (!name2) continue;
        details.push({ name: name2, kind: group.type === "Flow" ? "\u6D41\u91CF" : group.type === "Voice" ? "\u8BED\u97F3" : "\u77ED\u4FE1", unit: cleanLabel(item.unit), remaining: number(item.remain), used: number(item.use), total: number(item.total) });
        if (details.length >= 100) break;
      }
      if (details.length >= 100) break;
    }
    if (details.length) out.resourceDetails = details;
  }

  // scripts/carrier_hub_capture.source.js
  var DATA = "carrier_hub_v1";
  var PENDING = "carrier_hub_pending_v1";
  var DIAG = "carrier_hub_diagnostics_v1";
  function read(key) {
    try {
      return JSON.parse($prefs.valueForKey(key) || "{}");
    } catch (_) {
      return {};
    }
  }
  function notify(p, text) {
    $notify(names[p] + " \xB7 \u8FD0\u8425\u5546\u5C0F\u7EC4\u4EF6", "", text);
  }
  function nearby(url) {
    if (/^https:\/\/appfuwu\.189\.cn(?::9021)?\/query\//i.test(url)) return "telecom";
    if (/^https:\/\/(?:app|wx)\.10099\.com\.cn\/contact-web\/api\/busi\//i.test(url) && !/(?:login|password|sms|verify)/i.test(url.split("?")[0])) return "broadnet";
    if (/^https:\/\/m\.client\.10010\.com\/mobileService\/home\/query/i.test(url)) return "unicom";
    return null;
  }
  function diagnostic(p, stage, message, status) {
    const d = read(DIAG);
    d.version = 1;
    d.providers = d.providers || {};
    const old = d.providers[p];
    const match = String($request.url).match(/^https:\/\/([^/?#]+)([^?#]*)/);
    const path = match ? (match[1] + match[2]).replace(/[A-Za-z0-9_-]{16,}|\d{5,}/g, ":id") : "\u5DF2\u5339\u914D";
    d.providers[p] = { stage, path, time: Date.now(), ...status ? { status } : {} };
    $prefs.setValueForKey(JSON.stringify(d), DIAG);
    if (!old || old.stage !== stage || Date.now() - old.time > 6e4) notify(p, message);
  }
  function responseStatus() {
    const raw = $response.statusCode ?? $response.status ?? 200;
    const match = String(raw).match(/\b(\d{3})\b/);
    return match ? Number(match[1]) : Number(raw);
  }
  try {
    const p = endpoint($request.url);
    if (!p) {
      const candidate = nearby(String($request.url || ""));
      if (candidate) diagnostic(candidate, "nearby-query", "\u5DF2\u770B\u5230\u4E1A\u52A1\u67E5\u8BE2\u6D41\u91CF\uFF0C\u4F46\u63A5\u53E3\u5C1A\u672A\u9002\u914D\uFF0C\u672A\u4FDD\u5B58\u4F59\u91CF\u3002\u8BF7\u5728\u7EC4\u4EF6\u4E2D\u5BFC\u5165\u67E5\u770B\u8BCA\u65AD\u3002");
    }
    if (p) {
      const session = String($request.sessionIndex || "");
      if (typeof $response === "undefined") {
        const req = safeRequest($request);
        let authSaved = false;
        if (p === "telecom" && req?.method === "POST") {
          try {
            const body = JSON.parse(req.body);
            if (typeof body.headerInfos?.token === "string" && body.headerInfos.token.trim()) authSaved = $prefs.setValueForKey(JSON.stringify(req), "10000.app.request");
          } catch (_) {
          }
        }
        if (authSaved) diagnostic(p, "auth-saved", "\u5DF2\u4FDD\u5B58\u7535\u4FE1 App \u9274\u6743\u8BF7\u6C42\uFF08\u542B Token\uFF09\u3002\u8BF7\u5230 Scripting \u8D26\u53F7\u9875\u4ECE BoxJS \u5BFC\u5165\u5C1D\u8BD5\u67E5\u8BE2\uFF1B\u8FD9\u8FD8\u4E0D\u662F\u4F59\u91CF\u67E5\u8BE2\u6210\u529F\u3002");
        else diagnostic(p, "request-seen", "\u5DF2\u547D\u4E2D\u67E5\u8BE2\u8BF7\u6C42\uFF0C\u7B49\u5F85\u89E3\u6790\u54CD\u5E94\uFF1B\u8FD9\u8FD8\u4E0D\u662F\u6293\u53D6\u6210\u529F\u3002");
        if (req) {
          const pending = read(PENDING), key = p + ":" + session;
          pending[key] = { request: req, time: Date.now() };
          const clean = {};
          Object.keys(pending).filter((k) => Date.now() - pending[k].time < 12e4).slice(-16).forEach((k) => clean[k] = pending[k]);
          $prefs.setValueForKey(JSON.stringify(clean), PENDING);
        }
      } else if (responseStatus() === 200) {
        const metrics = normalize(p, JSON.parse($response.body || "{}"));
        const pending = read(PENDING), key = p + ":" + session, saved = pending[key];
        const data = read(DATA);
        data.version = 1;
        data.accounts = data.accounts || {};
        let request = saved && Date.now() - saved.time < 12e4 ? saved.request : null;
        if (!request && p === "unicom" && String($request.method || "GET").toUpperCase() === "GET") request = safeRequest($request);
        data.accounts[p] = { metrics, request, queryReady: !!request && (request.method === "GET" || !!request.body) };
        const ok = $prefs.setValueForKey(JSON.stringify(data), DATA);
        delete pending[key];
        $prefs.setValueForKey(JSON.stringify(pending), PENDING);
        if (ok) diagnostic(p, "saved", "\u5DF2\u4FDD\u5B58\u67E5\u8BE2\u6570\u636E" + (data.accounts[p].queryReady ? "\u53CA\u67E5\u8BE2\u8BF7\u6C42" : "\u5FEB\u7167") + "\u3002\u8BF7\u5728 Scripting \u4ECE BoxJS \u5BFC\u5165\uFF0C\u5B8C\u6210\u540E\u5173\u95ED\u6293\u53D6\u3002");
        else notify(p, "\u672C\u5730\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5708 X \u5B58\u50A8\u3002");
      } else {
        diagnostic(p, "http-error", "\u5DF2\u547D\u4E2D\u63A5\u53E3\uFF0C\u4F46 HTTP \u8FD4\u56DE\u672A\u6210\u529F\uFF0C\u672A\u4FDD\u5B58\u4F59\u91CF\u3002", responseStatus());
      }
    }
  } catch (_) {
    const p = endpoint($request.url);
    if (p) diagnostic(p, "schema-mismatch", "\u63A5\u53E3\u5DF2\u547D\u4E2D\uFF0C\u4F46\u54CD\u5E94\u683C\u5F0F\u5C1A\u672A\u9002\u914D\u6216\u4F1A\u8BDD\u5931\u6548\uFF1B\u672A\u8986\u76D6\u4E0A\u6B21\u6570\u636E\u3002");
  } finally {
    $done({});
  }
})();
