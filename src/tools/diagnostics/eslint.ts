import { ESLint } from "eslint";

export async function runEslint(files: string[]) {
  const eslint = new ESLint({
    useEslintrc: true,
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    errorOnUnmatchedPattern: false
  });

  const results = await eslint.lintFiles(files);
  const summary = results.reduce(
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
