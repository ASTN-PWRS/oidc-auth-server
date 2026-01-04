import { fileURLToPath } from "url";
import path from "path";
import nunjucks from "nunjucks";

export function initEngine(app) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const parentDir = path.resolve(__dirname, "..");

  // nunjucks の設定
  nunjucks.configure(path.join(parentDir, "templates"), {
    autoescape: true,
    noCache: true,
    express: app,
    watch: false,
  });

  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(["templates", "templates/components"]),
    { autoescape: true }
  );
  env.addGlobal("renderComponent", function (name, context = {}) {
    const scriptPath = path.join(
      __dirname,
      "templates",
      "components",
      `${name}.js`
    );
    const templatePath = path.join("components", `${name}.njk`);

    // 呼び出し元のテンプレートの context から usedScripts を取得
    const callerContext = this.ctx || {};
    const usedScripts = callerContext.usedScripts;

    if (fs.existsSync(scriptPath) && usedScripts) {
      usedScripts.add(`/components/${name}.js`);
    }

    const output = env.render(templatePath, context);
    return new nunjucks.runtime.SafeString(output);
  });

  env.addGlobal("renderScripts", function () {
    const callerContext = this.ctx || {};
    const usedScripts = callerContext.usedScripts;

    if (!usedScripts) return "";

    let output = "";
    for (const src of usedScripts) {
      output += `<script src="${src}"></script>\n`;
    }
    return new nunjucks.runtime.SafeString(output);
  });
}
