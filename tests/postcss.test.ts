import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import postcssFluidScale from '../src/postcss/index.js';

async function run(input: string, opts = {}) {
  const result = await postcss([postcssFluidScale(opts)]).process(input, {
    from: undefined,
  });
  return result.css;
}

describe('postcssFluidScale plugin', () => {
  it('transforms standard target properties with px units', async () => {
    const input = `
      .header {
        font-size: 32px;
        padding: 16px 24px;
        margin: 20px;
        gap: 16px;
        border-radius: 8px;
      }
    `;
    const output = await run(input);
    expect(output).toContain('font-size: clamp(');
    expect(output).toContain('padding: clamp(');
    expect(output).toContain('margin: clamp(');
    expect(output).toContain('gap: clamp(');
    expect(output).toContain('border-radius: clamp(');
  });

  it('preserves values below minThresholdPx (e.g. 1px borders or hairlines)', async () => {
    const input = `
      .card {
        border-radius: 2px;
        padding: 3px;
        margin: 16px;
      }
    `;
    const output = await run(input, { minThresholdPx: 4 });
    expect(output).toContain('border-radius: 2px;');
    expect(output).toContain('padding: 3px;');
    expect(output).toContain('margin: clamp(');
  });

  it('preserves non-px units and keywords', async () => {
    const input = `
      .hero {
        font-size: 1.5rem;
        padding: 2em;
        margin: auto;
        gap: 5%;
      }
    `;
    const output = await run(input);
    expect(output).toBe(input);
  });

  it('does not transform non-target properties by default', async () => {
    const input = `
      .box {
        width: 300px;
        height: 200px;
        top: 50px;
      }
    `;
    const output = await run(input);
    expect(output).toBe(input);
  });

  it('transforms custom properties when configured', async () => {
    const input = `
      .box {
        width: 300px;
        font-size: 16px;
      }
    `;
    const output = await run(input, { properties: ['width'] });
    expect(output).toContain('width: clamp(');
    // font-size is not in the custom properties list
    expect(output).toContain('font-size: 16px;');
  });

  it('skips declarations inside @media queries', async () => {
    const input = `
      .text {
        font-size: 16px;
      }
      @media (min-width: 768px) {
        .text {
          font-size: 24px;
        }
      }
    `;
    const output = await run(input);
    expect(output).toContain('font-size: clamp(');
    expect(output).toContain('font-size: 24px;');
  });

  it('skips declarations with /* fluid-ignore */ comments', async () => {
    const input = `
      .opt-out {
        /* fluid-ignore */
        font-size: 32px;
        padding: 16px; /* fluid-ignore */
        margin: 20px;
      }
    `;
    const output = await run(input);
    expect(output).toContain('font-size: 32px;');
    expect(output).toContain('padding: 16px');
    expect(output).toContain('margin: clamp(');
  });

  it('does not re-transform declarations that already contain clamp()', async () => {
    const input = `
      .custom {
        font-size: clamp(1rem, 2vw, 3rem);
      }
    `;
    const output = await run(input);
    expect(output).toBe(input);
  });
});
