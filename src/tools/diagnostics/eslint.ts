import { ESLint } from "eslint";

type LintSummary = { errorCount: number; warningCount: number };

export async function runEslint(files: string[]) {
  const eslint = new ESLint({});
  const codeFiles = Array.isArray(files)
    ? files.filter((f) => /\.[tj]sx?$/.test(f) && /[\\/](src)[\\/]/i.test(f))
    : [];
  const targets = codeFiles.length > 0 ? codeFiles : ["src/**/*.{ts,tsx,js,jsx}"];
  const results = await eslint.lintFiles(targets);

  const summary: LintSummary = results.reduce(
    (acc, r) => {
      acc.errorCount += r.errorCount;
      acc.warningCount += r.warningCount;
      return acc;
    },
    { errorCount: 0, warningCount: 0 }
  );

  return {
    summary,
    results: results.map((r) => ({
      filePath: r.filePath,
      errorCount: r.errorCount,
      warningCount: r.warningCount,
      messages: r.messages.map((m) => ({
        ruleId: m.ruleId,
        severity: m.severity,
        message: m.message,
        line: m.line,
        column: m.column
      }))
    }))
  };
}
