import ts from "typescript";
import path from "node:path";

export async function runTypecheck(root: string) {
  const tsconfigPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!tsconfigPath) return { ok: false, errors: [{ message: "tsconfig.json not found" }] };

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const configParse = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath));

  const program = ts.createProgram({
    rootNames: configParse.fileNames,
    options: { ...configParse.options, noEmit: true }
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const errors = diagnostics.map((d) => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
    let file: string | undefined;
    let line: number | undefined;
    let col: number | undefined;
    if (d.file && d.start !== undefined) {
      const pos = d.file.getLineAndCharacterOfPosition(d.start);
      file = d.file.fileName;
      line = pos.line + 1;
      col = pos.character + 1;
    }
    return { file, line, col, message: msg, code: d.code, category: ts.DiagnosticCategory[d.category] };
  });

  return { ok: errors.length === 0, errors };
}
