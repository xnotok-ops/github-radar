/**
 * GitHub Radar - Build Index
 * Generates docs/index.html from digest markdown files for GitHub Pages
 */

const fs = require("fs");
const path = require("path");

const digestDir = path.join(__dirname, "..", "digests");
const docsDir = path.join(__dirname, "..", "docs");

function getDigestFiles() {
  if (!fs.existsSync(digestDir)) return [];
  return fs
    .readdirSync(digestDir)
    .filter(f => f.endsWith(".md"))
    .sort()
    .reverse();
}

function buildHtml(files) {
  const fileList = files.map(f => {
    const date = f.replace('.md', '');
    return `<a href="#" class="digest-link" data-file="${f}" data-date="${date}"><span class="date">${date}</span></a>`;
  }).join('\n');

  const digestData = files.map(f => {
    const content = fs.readFileSync(path.join(digestDir, f), 'utf-8');
    return `digests[${JSON.stringify(f)}] = ${JSON.stringify(content)};`;
  }).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Radar — Daily Digests</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0f1a; color: #e2e8f0; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: #0d1117; border-right: 1px solid #1e2130; padding: 20px 0; overflow-y: auto; position: fixed; top: 0; bottom: 0; }
    .sidebar-header { padding: 0 16px 16px; border-bottom: 1px solid #1e2130; margin-bottom: 12px; }
    .sidebar-header h1 { font-family: monospace; font-size: 14px; color: #f8fafc; margin-bottom: 4px; }
    .sidebar-header p { font-size: 11px; color: #475569; }
    .digest-link { display: block; padding: 8px 16px; text-decoration: none; color: #94a3b8; font-family: monospace; font-size: 13px; border-left: 3px solid transparent; }
    .digest-link:hover { background: #12141a; color: #7dd3fc; }
    .digest-link.active { background: #12141a; color: #7dd3fc; border-left-color: #7dd3fc; }
    .content { margin-left: 240px; flex: 1; padding: 32px 40px; max-width: 900px; }
    .content h1 { font-family: monospace; font-size: 22px; color: #f8fafc; margin-bottom: 8px; }
    .content h2 { font-size: 18px; color: #7dd3fc; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #1e2130; }
    .content h3 { font-size: 15px; color: #f59e0b; margin: 16px 0 8px; }
    .content p { font-size: 14px; line-height: 1.7; color: #cbd5e1; margin-bottom: 8px; }
    .content a { color: #7dd3fc; text-decoration: none; }
    .content a:hover { text-decoration: underline; }
    .content strong { color: #f8fafc; }
    .content hr { border: none; border-top: 1px solid #1e2130; margin: 20px 0; }
    .content ul { margin: 8px 0 8px 20px; }
    .content li { font-size: 13px; color: #94a3b8; margin-bottom: 4px; line-height: 1.5; }
    .content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    .content td { padding: 6px 10px; border: 1px solid #1e2130; color: #94a3b8; }
    .content tr:first-child td { background: #12141a; color: #f8fafc; font-weight: 600; }
    .empty-state { text-align: center; padding: 80px 20px; color: #475569; }
    @media (max-width: 768px) {
      .sidebar { width: 100%; position: relative; border-right: none; border-bottom: 1px solid #1e2130; display: flex; overflow-x: auto; padding: 12px; gap: 8px; }
      .sidebar-header { display: none; }
      .digest-link { padding: 6px 12px; white-space: nowrap; border-left: none; font-size: 12px; }
      .layout { flex-direction: column; }
      .content { margin-left: 0; padding: 20px 16px; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1>🔭 GitHub Radar</h1>
        <p>Daily trending digests</p>
      </div>
      ${fileList || '<div style="padding:16px;font-size:12px;color:#475569">No digests yet</div>'}
    </nav>
    <main class="content" id="content">
      <div class="empty-state">
        <div style="font-size:48px;margin-bottom:16px">🔭</div>
        <h2 style="border:none;color:#f8fafc">GitHub Radar</h2>
        <p>Select a date from the sidebar to view the daily digest.</p>
      </div>
    </main>
  </div>
  <script>
    var digests = {};
    ${digestData}

    function mdToHtml(md) {
      return md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\\*\\*\\[(.+?)\\]\\((.+?)\\)\\*\\*/g, '<strong><a href="$2" target="_blank">$1</a></strong>')
        .replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\\n/g, '<br>');
    }

    document.querySelectorAll('.digest-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.digest-link').forEach(function(l){l.classList.remove('active')});
        this.classList.add('active');
        var md = digests[this.dataset.file];
        if (md) document.getElementById('content').innerHTML = mdToHtml(md);
      });
    });

    var firstLink = document.querySelector('.digest-link');
    if (firstLink) firstLink.click();
  </script>
</body>
</html>`;
}

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

var files = getDigestFiles();
var html = buildHtml(files);
fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");
console.log("Web UI built: docs/index.html (" + files.length + " digests)");
