import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import { MAIL_TEMPLATE_CATALOG } from './mail-template.catalog';
import type { MailEmailType, MailTemplateVariables } from './mail.types';

export type RenderedMailTemplate = {
  subject: string;
  html: string;
};

const TRIPLE_PLACEHOLDER_PATTERN = /\{\{\{([A-Z][A-Z0-9_]*)\}\}\}/g;
const UNRESOLVED_TRIPLE_PLACEHOLDER_PATTERN = /\{\{\{[A-Z][A-Z0-9_]*\}\}\}/;
const UNRESOLVED_PLACEHOLDER_PATTERN = /\{\{[^{}]+\}\}|\{[A-Z][A-Z0-9_]*\}/;

@Injectable()
export class MailTemplateRenderer {
  private readonly sourceCache = new Map<MailEmailType, string>();

  async render(
    type: MailEmailType,
    variables: MailTemplateVariables,
  ): Promise<RenderedMailTemplate> {
    const source = await this.loadSource(type);

    return renderMailTemplateSource(type, source, variables);
  }

  private async loadSource(type: MailEmailType): Promise<string> {
    const cachedSource = this.sourceCache.get(type);

    if (cachedSource) {
      return cachedSource;
    }

    const definition = MAIL_TEMPLATE_CATALOG[type];
    const source = await readFile(
      join(__dirname, 'templates', definition.fileName),
      'utf8',
    );

    this.sourceCache.set(type, source);

    return source;
  }
}

export function renderMailTemplateSource(
  type: MailEmailType,
  source: string,
  variables: MailTemplateVariables,
): RenderedMailTemplate {
  const definition = MAIL_TEMPLATE_CATALOG[type];
  const expectedVariables = new Set(definition.variables);
  const sourceVariables = new Set(
    Array.from(
      source.matchAll(TRIPLE_PLACEHOLDER_PATTERN),
      (match) => match[1],
    ),
  );

  assertSameVariables(type, 'template', expectedVariables, sourceVariables);

  if (hasMalformedPlaceholder(source)) {
    throw new Error(`Malformed placeholder in mail template ${type}`);
  }

  const providedVariables = new Set(Object.keys(variables));
  assertSameVariables(type, 'payload', expectedVariables, providedVariables);
  validateAbsoluteUrls(type, variables);

  const html = source.replace(
    TRIPLE_PLACEHOLDER_PATTERN,
    (_placeholder, variableName: string) =>
      escapeHtml(String(variables[variableName])),
  );

  if (
    UNRESOLVED_TRIPLE_PLACEHOLDER_PATTERN.test(html) ||
    UNRESOLVED_PLACEHOLDER_PATTERN.test(html)
  ) {
    throw new Error(`Unresolved placeholder in rendered mail ${type}`);
  }

  const subject = extractSubject(type, html);

  return { subject, html };
}

function assertSameVariables(
  type: MailEmailType,
  sourceName: 'template' | 'payload',
  expected: ReadonlySet<string>,
  actual: ReadonlySet<string>,
): void {
  const missing = [...expected].filter((variable) => !actual.has(variable));
  const unexpected = [...actual].filter((variable) => !expected.has(variable));

  if (missing.length === 0 && unexpected.length === 0) {
    return;
  }

  const details = [
    missing.length > 0 ? `missing=${missing.join(',')}` : undefined,
    unexpected.length > 0 ? `unexpected=${unexpected.join(',')}` : undefined,
  ]
    .filter((detail): detail is string => detail !== undefined)
    .join(' ');

  throw new Error(`Invalid ${sourceName} variables for ${type}: ${details}`);
}

function hasMalformedPlaceholder(source: string): boolean {
  const withoutValidPlaceholders = source.replace(
    TRIPLE_PLACEHOLDER_PATTERN,
    '',
  );

  return UNRESOLVED_PLACEHOLDER_PATTERN.test(withoutValidPlaceholders);
}

function validateAbsoluteUrls(
  type: MailEmailType,
  variables: MailTemplateVariables,
): void {
  for (const [name, rawValue] of Object.entries(variables)) {
    if (!name.endsWith('_URL')) {
      continue;
    }

    try {
      const url = new URL(String(rawValue));

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Unsupported URL protocol');
      }
    } catch {
      throw new Error(`Invalid absolute URL variable ${name} for ${type}`);
    }
  }
}

function extractSubject(type: MailEmailType, html: string): string {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  const subject = match?.[1]
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!subject) {
    throw new Error(`Missing email subject for ${type}`);
  }

  return subject;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
