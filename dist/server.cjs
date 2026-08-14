var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
    }
    return new import_genai.GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "WealthYar" });
  });
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { totalIncome, totalExpense, balance, savingsGoal, categoryBreakdown, topExpenses, goalProgress } = req.body;
      const ai = getAiClient();
      const prompt = `
\u0634\u0645\u0627 "\u0645\u0634\u0627\u0648\u0631 \u0627\u0631\u0634\u062F \u0645\u0627\u0644\u06CC \u0648\u0644\u062A\u06CC\u0627\u0631 (WealthYar)" \u0647\u0633\u062A\u06CC\u062F.
\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0648\u0636\u0639\u06CC\u062A \u0645\u0627\u0644\u06CC \u0641\u0639\u0644\u06CC \u06A9\u0627\u0631\u0628\u0631 \u0628\u0647 \u0634\u0631\u062D \u0632\u06CC\u0631 \u0627\u0633\u062A:
- \u0645\u062C\u0645\u0648\u0639 \u062F\u0631\u0622\u0645\u062F \u0645\u0627\u0647\u0627\u0646\u0647: ${Number(totalIncome || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u0645\u062C\u0645\u0648\u0639 \u0647\u0632\u06CC\u0646\u0647 \u0645\u0627\u0647\u0627\u0646\u0647: ${Number(totalExpense || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u062E\u0627\u0644\u0635 \u062F\u0627\u0631\u0627\u06CC\u06CC / \u0645\u0627\u0646\u062F\u0647 \u062D\u0633\u0627\u0628: ${Number(balance || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u0647\u062F\u0641 \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632 \u0645\u0627\u0647\u0627\u0646\u0647: ${Number(savingsGoal || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u062F\u0631\u0635\u062F \u062A\u062D\u0642\u0642 \u0647\u062F\u0641 \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632: %${Math.min(Math.round(goalProgress || 0), 100)}
- \u062A\u0641\u06A9\u06CC\u06A9 \u0647\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0628\u0631 \u0627\u0633\u0627\u0633 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC: ${JSON.stringify(categoryBreakdown || {})}
- \u067E\u0631\u062E\u0631\u062C\u200C\u062A\u0631\u06CC\u0646 \u062A\u0631\u0627\u06A9\u0646\u0634\u200C\u0647\u0627: ${JSON.stringify(topExpenses || [])}

\u0644\u0637\u0641\u0627 \u06CC\u06A9 \u062A\u062D\u0644\u06CC\u0644 \u062C\u0627\u0645\u0639\u060C \u062F\u0642\u06CC\u0642 \u0648 \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC \u0634\u06CC\u0648\u0627 \u0648 \u0645\u062D\u062A\u0631\u0645\u0627\u0646\u0647 \u0628\u0627 \u0633\u0627\u062E\u062A\u0627\u0631 \u0632\u06CC\u0631 \u0627\u0631\u0627\u0626\u0647 \u062F\u0647\u06CC\u062F:
1. **\u062E\u0644\u0627\u0635\u0647 \u0648\u0636\u0639\u06CC\u062A \u0645\u0627\u0644\u06CC:** \u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u06A9\u0644\u06CC \u0646\u0633\u0628\u062A \u062F\u0631\u0622\u0645\u062F \u0628\u0647 \u0647\u0632\u06CC\u0646\u0647 \u0648 \u0633\u0644\u0627\u0645\u062A \u0645\u0627\u0644\u06CC.
2. **\u0634\u0646\u0627\u0633\u0627\u06CC\u06CC \u0631\u06CC\u0633\u06A9 \u0648 \u0647\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u067E\u0631\u062E\u0637\u0631:** \u062A\u062D\u0644\u06CC\u0644 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC\u200C\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0628\u06CC\u0634\u062A\u0631\u06CC\u0646 \u0633\u0647\u0645 \u0627\u0632 \u062F\u0631\u0622\u0645\u062F \u0631\u0627 \u0628\u0644\u0639\u06CC\u062F\u0647\u200C\u0627\u0646\u062F \u0648 \u0647\u0634\u062F\u0627\u0631 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0631\u06CC\u0633\u06A9.
3. **\u0627\u0631\u0632\u06CC\u0627\u0628\u06CC \u0647\u062F\u0641 \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632:** \u0631\u0627\u0647\u06A9\u0627\u0631\u0647\u0627\u06CC \u0639\u0645\u0644\u06CC \u0628\u0631\u0627\u06CC \u067E\u0631 \u06A9\u0631\u062F\u0646 \u0641\u0627\u0635\u0644\u0647 \u0628\u0627\u0642\u06CC\u200C\u0645\u0627\u0646\u062F\u0647 \u062A\u0627 \u0647\u062F\u0641 \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632.
4. **\u062A\u0648\u0635\u06CC\u0647 \u0628\u0648\u062F\u062C\u0647\u200C\u0628\u0646\u062F\u06CC (\u0642\u0627\u0646\u0648\u0646 \u06F5\u06F0/\u06F3\u06F0/\u06F2\u06F0):** \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u062A\u0642\u0633\u06CC\u0645\u200C\u0628\u0646\u062F\u06CC \u062F\u0631\u0633\u062A \u062F\u0631\u0622\u0645\u062F \u0627\u06CC\u0646 \u0645\u0627\u0647 \u0628\u0647 \u0646\u06CC\u0627\u0632\u0645\u0646\u062F\u06CC\u200C\u0647\u0627 (\u06F5\u06F0\u066A)\u060C \u062E\u0648\u0627\u0633\u062A\u0647\u200C\u0647\u0627 (\u06F3\u06F0\u066A) \u0648 \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632/\u0633\u0631\u0645\u0627\u06CC\u0647\u200C\u06AF\u0630\u0627\u0631\u06CC (\u06F2\u06F0\u066A).
5. **\u06F3 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u0647\u0648\u0634\u0645\u0646\u062F \u0648 \u0641\u0648\u0631\u06CC:** \u0627\u0642\u062F\u0627\u0645\u0627\u062A \u0633\u0631\u06CC\u0639 \u0648 \u0645\u0644\u0645\u0648\u0633\u06CC \u06A9\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0647\u0645\u06CC\u0646 \u0627\u0645\u0631\u0648\u0632 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0627\u0646\u062C\u0627\u0645 \u062F\u0647\u062F.
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "\u0634\u0645\u0627 \u0645\u0634\u0627\u0648\u0631 \u0627\u0631\u0634\u062F \u0641\u06CC\u0646\u200C\u062A\u06A9 \u0648 \u0645\u062F\u06CC\u0631\u06CC\u062A \u062F\u0627\u0631\u0627\u06CC\u06CC \u0648\u0644\u062A\u06CC\u0627\u0631 \u0647\u0633\u062A\u06CC\u062F. \u0644\u062D\u0646 \u0634\u0645\u0627 \u062D\u0631\u0641\u0647\u200C\u0627\u06CC\u060C \u0645\u0634\u0648\u0642\u060C \u0645\u0644\u0645\u0648\u0633 \u0648 \u06A9\u0627\u0645\u0644\u0627 \u062F\u0642\u06CC\u0642 \u0627\u0633\u062A. \u062A\u0645\u0627\u0645 \u0627\u0639\u062F\u0627\u062F \u0631\u0627 \u0628\u0627 \u062C\u062F\u0627\u06A9\u0646\u0646\u062F\u0647 \u0648 \u0628\u0647 \u0641\u0627\u0631\u0633\u06CC \u06CC\u0627 \u0628\u0627 \u062F\u0642\u062A \u0645\u0627\u0644\u06CC \u0627\u0631\u0627\u0626\u0647 \u06A9\u0646\u06CC\u062F."
        }
      });
      res.json({ success: true, analysis: response.text || "\u062A\u062D\u0644\u06CC\u0644 \u062A\u0648\u0644\u06CC\u062F \u0646\u0634\u062F." });
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      res.status(500).json({
        success: false,
        error: error.message || "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0642\u0631\u0627\u0631\u06CC \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u0648\u0644\u062A\u06CC\u0627\u0631"
      });
    }
  });
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, financialContext } = req.body;
      const ai = getAiClient();
      const contextSummary = financialContext ? `
\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u0627\u0644\u06CC \u0648\u0627\u0642\u0639\u06CC \u06A9\u0627\u0631\u0628\u0631 \u0648\u0644\u062A\u06CC\u0627\u0631:
- \u062F\u0631\u0622\u0645\u062F \u0645\u0627\u0647\u0627\u0646\u0647: ${Number(financialContext.totalIncome || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u0647\u0632\u06CC\u0646\u0647 \u0645\u0627\u0647\u0627\u0646\u0647: ${Number(financialContext.totalExpense || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u062F\u0627\u0631\u0627\u06CC\u06CC \u0641\u0639\u0644\u06CC: ${Number(financialContext.balance || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
- \u0647\u062F\u0641 \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632: ${Number(financialContext.savingsGoal || 0).toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646
` : "";
      const formattedHistory = (messages || []).map((m) => `${m.role === "user" ? "\u06A9\u0627\u0631\u0628\u0631" : "\u0645\u0634\u0627\u0648\u0631 \u0648\u0644\u062A\u06CC\u0627\u0631"}: ${m.content}`).join("\n\n");
      const fullPrompt = `${contextSummary}

\u062A\u0627\u0631\u06CC\u062E\u0686\u0647 \u06AF\u0641\u062A\u06AF\u0648:
${formattedHistory}

\u067E\u0627\u0633\u062E \u0628\u0639\u062F\u06CC \u0645\u0634\u0627\u0648\u0631 \u0645\u0627\u0644\u06CC \u0648\u0644\u062A\u06CC\u0627\u0631:`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: "\u0634\u0645\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0648 \u0645\u0634\u0627\u0648\u0631 \u0645\u0627\u0644\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u0648\u0644\u062A\u06CC\u0627\u0631 (WealthYar) \u0647\u0633\u062A\u06CC\u062F. \u0628\u0647 \u0633\u0648\u0627\u0644\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u062F\u0642\u06CC\u0642\u060C \u0645\u0644\u0645\u0648\u0633 \u0648 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC \u0634\u06CC\u0648\u0627 \u067E\u0627\u0633\u062E \u062F\u0647\u06CC\u062F. \u0627\u06AF\u0631 \u06A9\u0627\u0631\u0628\u0631 \u0633\u0648\u0627\u0644\u06CC \u062F\u0631\u0628\u0627\u0631\u0647 \u0628\u0648\u062F\u062C\u0647\u200C\u0628\u0646\u062F\u06CC\u060C \u06A9\u0627\u0647\u0634 \u0647\u0632\u06CC\u0646\u0647\u060C \u0633\u0631\u0645\u0627\u06CC\u0647\u200C\u06AF\u0630\u0627\u0631\u06CC \u06CC\u0627 \u0645\u062F\u06CC\u0631\u06CC\u062A \u067E\u0633\u200C\u0627\u0646\u062F\u0627\u0632 \u067E\u0631\u0633\u06CC\u062F\u060C \u0627\u0632 \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0648\u0627\u0642\u0639\u06CC \u062D\u0633\u0627\u0628 \u0627\u0648 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646\u06CC\u062F \u0648 \u0631\u0627\u0647\u06A9\u0627\u0631 \u0639\u0627\u0644\u06CC \u0628\u062F\u0647\u06CC\u062F."
        }
      });
      res.json({ success: true, reply: response.text || "\u067E\u0627\u0633\u062E\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    } catch (error) {
      console.error("Error in AI Chat endpoint:", error);
      res.status(500).json({
        success: false,
        error: error.message || "\u062E\u0637\u0627 \u062F\u0631 \u067E\u0631\u062F\u0627\u0632\u0634 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WealthYar Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
