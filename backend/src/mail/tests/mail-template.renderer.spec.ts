import { MAIL_TEMPLATE_CATALOG } from '../mail-template.catalog';
import {
  MailTemplateRenderer,
  renderMailTemplateSource,
} from '../mail-template.renderer';
import type { MailEmailType, MailTemplateVariables } from '../mail.types';

const emailTypes = Object.keys(MAIL_TEMPLATE_CATALOG) as MailEmailType[];

describe('MailTemplateRenderer', () => {
  it.each(emailTypes)(
    'renders %s without unresolved placeholders',
    async (type) => {
      const renderer = new MailTemplateRenderer();
      const rendered = await renderer.render(type, buildVariables(type));

      expect(rendered.subject).not.toHaveLength(0);
      expect(rendered.html.toLowerCase()).toContain('<!doctype html>');
      expect(rendered.html).not.toMatch(/\{\{[^{}]+\}\}|\{[A-Z][A-Z0-9_]*\}/);
    },
  );

  it('escapes inserted values before sending HTML', () => {
    const type = 'auth.verify_email';
    const variables = buildVariables(type);
    variables.USER_NAME = '<script>alert("mail")</script>';

    const rendered = renderMailTemplateSource(
      type,
      buildMinimalSource(type),
      variables,
    );

    expect(rendered.html).toContain(
      '&lt;script&gt;alert(&quot;mail&quot;)&lt;/script&gt;',
    );
    expect(rendered.html).not.toContain('<script>alert');
  });

  it('rejects missing payload variables', () => {
    const type = 'auth.verify_email';
    const variables = buildVariables(type);
    delete variables.VERIFY_URL;

    expect(() =>
      renderMailTemplateSource(type, buildMinimalSource(type), variables),
    ).toThrow('Invalid payload variables for auth.verify_email');
  });

  it('rejects unknown payload variables', () => {
    const type = 'auth.verify_email';
    const variables = {
      ...buildVariables(type),
      TOKEN: 'must-not-be-sent',
    };

    expect(() =>
      renderMailTemplateSource(type, buildMinimalSource(type), variables),
    ).toThrow('unexpected=TOKEN');
  });

  it('rejects malformed template placeholders', () => {
    const type = 'auth.verify_email';
    const malformedSource = buildMinimalSource(type).replace(
      '{{{VERIFY_URL}}}',
      '{{VERIFY_URL}}',
    );

    expect(() =>
      renderMailTemplateSource(type, malformedSource, buildVariables(type)),
    ).toThrow('Invalid template variables for auth.verify_email');
  });

  it('rejects relative CTA URLs', () => {
    const type = 'auth.verify_email';
    const variables = buildVariables(type);
    variables.VERIFY_URL = '/verify-email?token=unsafe';

    expect(() =>
      renderMailTemplateSource(type, buildMinimalSource(type), variables),
    ).toThrow('Invalid absolute URL variable VERIFY_URL');
  });
});

function buildVariables(type: MailEmailType): MailTemplateVariables {
  return Object.fromEntries(
    MAIL_TEMPLATE_CATALOG[type].variables.map((variable) => {
      if (variable.endsWith('_URL')) {
        return [variable, `https://hovren.fr/test?target=${variable}`];
      }

      if (variable === 'CURRENT_YEAR') {
        return [variable, 2026];
      }

      if (variable === 'EXPIRATION_MINUTES') {
        return [variable, 30];
      }

      return [variable, `Valeur ${variable}`];
    }),
  );
}

function buildMinimalSource(type: MailEmailType): string {
  const placeholders = MAIL_TEMPLATE_CATALOG[type].variables
    .map((variable) => `<p>{{{${variable}}}}</p>`)
    .join('');

  return `<!doctype html><html><head><title>Email HOVREN</title></head><body>${placeholders}</body></html>`;
}
