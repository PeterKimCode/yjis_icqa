const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const indexPath = path.join(rootDir, 'index.html');
const backupPath = path.join(rootDir, 'index.src.html');

const sectionMap = {
  about: 'about.md',
  education: 'education.md',
  counseling: 'counseling.md',
  management: 'management.md',
  contact: 'contact.md',
};

function convertMarkdownToHtml(markdown) {
  if (!markdown || !markdown.trim()) {
    return '';
  }

  const boldConverted = markdown.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const lines = boldConverted
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line}</p>`);

  return lines.join('\n');
}

function replaceSectionContent(html, sectionId, contentHtml) {
  const sectionRegex = new RegExp(`(<section[^>]*id="${sectionId}"[^>]*>[\\s\\S]*?)(<p>[\\s\\S]*?<\\/p>)([\\s\\S]*?<\\/section>)`, 'i');
  const match = html.match(sectionRegex);

  if (!match) {
    throw new Error(`Section with id "${sectionId}" not found in index.html`);
  }

  const replacement = contentHtml || '';

  return html.replace(sectionRegex, `${match[1]}${replacement}${match[3]}`);
}

function build() {
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found');
  }

  const originalHtml = fs.readFileSync(indexPath, 'utf8');

  fs.copyFileSync(indexPath, backupPath);

  let updatedHtml = originalHtml;

  for (const [sectionId, fileName] of Object.entries(sectionMap)) {
    const filePath = path.join(contentDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`Content file not found for section ${sectionId}: ${fileName}`);
      continue;
    }

    const markdown = fs.readFileSync(filePath, 'utf8');
    const htmlContent = convertMarkdownToHtml(markdown);
    updatedHtml = replaceSectionContent(updatedHtml, sectionId, htmlContent);
  }

  fs.writeFileSync(indexPath, updatedHtml, 'utf8');
}

try {
  build();
  console.log('Content build completed successfully.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
