const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('global instructions define compact progress and mandatory exceptions', () => {
  const instructions = readRepositoryFile('instructions/global-instructions.md.instructions.md');

  assert.match(instructions, /Progreso conversacional/);
  assert.match(instructions, /No narrar búsquedas, lecturas, comandos ni microacciones/);
  assert.match(instructions, /comprobaciones internas que terminan correctamente/);
  assert.match(instructions, /bloqueos.*decisiones.*riesgos/s);
  assert.match(instructions, /informes.*gates.*detalle/s);
  assert.match(instructions, /seguridad.*integridad.*coste.*aprobación explícita/s);
});

test('Alfred uses compact phase updates without removing gate reporting', () => {
  const alfred = readRepositoryFile('agents/alfred.agent.md');

  assert.match(alfred, /Formato compacto/);
  assert.match(alfred, /Estado:/);
  assert.match(alfred, /Siguiente:/);
  assert.match(alfred, /Informa al usuario.*compact/s);
  assert.match(alfred, /veredicto/);
  assert.match(alfred, /qa_seguridad_aprobado/);
  assert.match(alfred, /OWASP/);
  assert.match(alfred, /Compliance check/);
});

test('QA accumulates exploratory notes instead of narrating them live', () => {
  const qa = readRepositoryFile('agents/qa-engineer.agent.md');

  assert.match(qa, /notas acumuladas al cierre/);
  assert.doesNotMatch(qa, /Documentación en tiempo real/);
});

test('Lucius audits with search by default and keeps Codex CLI optional', () => {
  const lucius = readRepositoryFile('agents/lucius.agent.md');
  const readme = readRepositoryFile('README.md');

  assert.match(lucius, /Por defecto auditas con `search`/);
  assert.match(lucius, /Codex CLI es opcional/);
  assert.match(lucius, /confirmación explícita/);
  assert.match(lucius, /No narrar comandos ni comprobaciones exitosas/);
  assert.match(lucius, /Nunca ejecutes la auditoría sin confirmación/);
  assert.match(lucius, /--sandbox read-only/);
  assert.match(lucius, /cmp -s/);
  assert.doesNotMatch(lucius, /Requiere Codex CLI instalado/);
  assert.match(readme, /audita con `search`/);
  assert.match(readme, /Codex CLI es opcional/);
});

test('Autopilot closes the requested work instead of chaining phases', () => {
  const instructions = readRepositoryFile('instructions/global-instructions.md.instructions.md');
  const alfred = readRepositoryFile('agents/alfred.agent.md');
  const techWriter = readRepositoryFile('agents/tech-writer.agent.md');

  assert.match(instructions, /No iniciar fases nuevas sin una petición explícita/);
  assert.match(alfred, /Delega solo el trabajo imprescindible para la petición actual/);
  assert.match(alfred, /Una gate rechazada se informa y cierra la ejecución actual/);
  assert.doesNotMatch(alfred, /la fase se repite o se corrige/);
  assert.doesNotMatch(techWriter, /agent: devops-engineer/);
});

test('every agent handoff requires explicit user confirmation', () => {
  const agentsDirectory = path.join(repositoryRoot, 'agents');
  const agentFiles = fs.readdirSync(agentsDirectory).filter((fileName) => fileName.endsWith('.agent.md'));

  for (const agentFile of agentFiles) {
    const frontmatter = fs.readFileSync(path.join(agentsDirectory, agentFile), 'utf8').split('---')[1];
    const handoffCount = (frontmatter.match(/^\s*-\s+label:/gm) ?? []).length;
    const confirmationCount = (frontmatter.match(/^\s+send:\s*false\s*$/gm) ?? []).length;

    assert.equal(
      confirmationCount,
      handoffCount,
      `${agentFile} must declare send: false for every handoff`,
    );
  }
});

test('Alfred has only the tools needed to orchestrate and reconstruct state', () => {
  const alfred = readRepositoryFile('agents/alfred.agent.md');
  const frontmatter = alfred.split('---')[1];

  assert.match(frontmatter, /tools: \['search', 'execute', 'web', 'agent'\]/);
  assert.doesNotMatch(frontmatter, /tools: \[[^\]]*'edit'/);
  assert.doesNotMatch(frontmatter, /['"]terminal['"]/);
  assert.doesNotMatch(frontmatter, /['"]read['"]/);
});

test('each agent declares the exact tool set for its role', () => {
  const expectedTools = {
    'alfred.agent.md': "tools: ['search', 'execute', 'web', 'agent']",
    'product-owner.agent.md': "tools: ['search', 'edit', 'execute', 'web']",
    'selina.agent.md': "tools: ['search', 'edit', 'execute']",
    'architect.agent.md': "tools: ['search', 'edit', 'web', 'execute']",
    'junior-dev.agent.md': "tools: ['search', 'edit', 'execute']",
    'senior-dev.agent.md': "tools: ['search', 'edit', 'execute', 'agent']",
    'security-officer.agent.md': "tools: ['search', 'edit', 'execute', 'web']",
    'qa-engineer.agent.md': "tools: ['search', 'edit', 'execute', 'agent']",
    'tech-writer.agent.md': "tools: ['search', 'edit', 'execute']",
    'devops-engineer.agent.md': "tools: ['search', 'edit', 'execute']",
    'lucius.agent.md': "tools: ['search', 'execute']",
    'seo-specialist.agent.md': "tools: ['search', 'edit', 'execute']",
  };

  for (const [agentFile, toolsLine] of Object.entries(expectedTools)) {
    const frontmatter = readRepositoryFile(path.join('agents', agentFile)).split('---')[1];
    assert.match(frontmatter, new RegExp(toolsLine.replace(/[[\]]/g, '\\$&')));
    assert.doesNotMatch(frontmatter, /['"]terminal['"]/);
    assert.doesNotMatch(frontmatter, /tools: \[[^\]]*'read'/);
  }

  const seniorFrontmatter = readRepositoryFile('agents/senior-dev.agent.md').split('---')[1];
  const qaFrontmatter = readRepositoryFile('agents/qa-engineer.agent.md').split('---')[1];
  const alfred = readRepositoryFile('agents/alfred.agent.md');
  const alfredFrontmatter = alfred.split('---')[1];

  assert.match(seniorFrontmatter, /agents: \['security-officer'\]/);
  assert.match(qaFrontmatter, /agents: \['security-officer'\]/);
  assert.match(alfred, /Delegas al rol, no al modelo/);
  assert.doesNotMatch(alfredFrontmatter, /^[ \t]+model:/m);
});

test('model cost follows task difficulty, not job title', () => {
  const alfredFrontmatter = readRepositoryFile('agents/alfred.agent.md').split('---')[1];
  const seniorFrontmatter = readRepositoryFile('agents/senior-dev.agent.md').split('---')[1];
  const architectFrontmatter = readRepositoryFile('agents/architect.agent.md').split('---')[1];
  const productOwnerFrontmatter = readRepositoryFile('agents/product-owner.agent.md').split('---')[1];
  const qaFrontmatter = readRepositoryFile('agents/qa-engineer.agent.md').split('---')[1];
  const juniorFrontmatter = readRepositoryFile('agents/junior-dev.agent.md').split('---')[1];
  const readme = readRepositoryFile('README.md');

  assert.match(alfredFrontmatter, /GPT 5\.6 Luna \(openai-codex\)/);
  assert.doesNotMatch(alfredFrontmatter, /GPT 5\.6 Terra|GPT 5\.6 Sol/);
  assert.match(seniorFrontmatter, /GPT 5\.6 Sol \(openai-codex\)/);
  assert.match(architectFrontmatter, /GPT 5\.6 Terra \(openai-codex\)/);
  assert.match(productOwnerFrontmatter, /GPT 5\.6 Luna \(openai-codex\)/);
  assert.match(qaFrontmatter, /GPT 5\.6 Terra \(openai-codex\)/);
  assert.match(juniorFrontmatter, /GPT 5\.6 Luna \(openai-codex\)/);
  assert.match(readme, /Alfred orquesta en Luna/);
  assert.match(readme, /senior-dev.*Sol/s);
});

test('tech-writer duplicates GitHub state into status.md and Alfred only reads it', () => {
  const alfred = readRepositoryFile('agents/alfred.agent.md');
  const techWriter = readRepositoryFile('agents/tech-writer.agent.md');
  const instructions = readRepositoryFile('instructions/global-instructions.md.instructions.md');
  const docsSkill = readRepositoryFile('skills/core/sync-project-docs/SKILL.md');
  const skillsIndex = readRepositoryFile('skills/README.md');
  const readme = readRepositoryFile('README.md');
  const statusTemplate = readRepositoryFile('templates/status.md');
  const agentsDirectory = path.join(repositoryRoot, 'agents');
  const agentFiles = fs.readdirSync(agentsDirectory).filter((fileName) => fileName.endsWith('.agent.md'));

  assert.match(alfred, /solo lo escribe `tech-writer`/);
  assert.match(alfred, /No lo editas/);
  assert.doesNotMatch(alfred, /El agente que cierra la gate actualiza/);
  assert.doesNotMatch(alfred, /y commitealo \(`chore: update flow status`\)/);
  assert.match(alfred, /execute.*reconstruir estado|consultar el estado/s);
  assert.match(alfred, /reseleccionar el agente|chat nuevo/);
  assert.match(techWriter, /único agente que lo escribe/);
  assert.match(techWriter, /duplicado local de GitHub/);
  assert.match(instructions, /`tech-writer` duplica ese estado/);
  assert.match(docsSkill, /Solo\s*`tech-writer`\s*lo escribe/s);
  assert.doesNotMatch(docsSkill, /el agente que cierra la gate/);
  assert.match(skillsIndex, /`sync-project-docs` \| Docs vivas \/ `plans\/` \/ `status\.md` \| `tech-writer`/);
  assert.doesNotMatch(skillsIndex, /`tech-writer`, `alfred`/);
  assert.match(readme, /Lo escribe `tech-writer`/);
  assert.match(readme, /Alfred lee el snapshot; no lo edita/);
  assert.match(statusTemplate, /Lo escribe `tech-writer`/);

  for (const agentFile of agentFiles) {
    const content = fs.readFileSync(path.join(agentsDirectory, agentFile), 'utf8');

    if (agentFile === 'tech-writer.agent.md') {
      continue;
    }

    if (agentFile === 'alfred.agent.md') {
      assert.match(content, /No lo editas/);
      continue;
    }

    if (agentFile === 'lucius.agent.md') {
      assert.match(content, /nunca modificas ficheros/);
      continue;
    }

    assert.match(
      content,
      /No actualices `docs\/project\/status\.md`/,
      `${agentFile} must not write status.md`,
    );
  }
});
