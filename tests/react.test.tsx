import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, afterEach } from 'vitest';
import { FluidGrid } from '../src/react/FluidGrid.js';
import { useLayoutGuard } from '../src/react/useLayoutGuard.js';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let activeRoots: { root: Root; container: HTMLElement }[] = [];

function render(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  const unmount = () => {
    act(() => {
      root.unmount();
    });
    container.remove();
  };
  activeRoots.push({ root, container });
  return { container, unmount };
}

describe('FluidGrid', () => {
  afterEach(() => {
    act(() => {
      while (activeRoots.length > 0) {
        const item = activeRoots.pop();
        item?.root.unmount();
        item?.container.remove();
      }
    });
  });

  it('renders a grid container with default styles and fluid clamp gap', () => {
    const { container } = render(
      <FluidGrid data-testid="grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </FluidGrid>
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid).toBeDefined();
    expect(grid.tagName.toLowerCase()).toBe('div');
    expect(grid.style.display).toBe('grid');
    expect(grid.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'
    );
    expect(grid.style.gap).toContain('clamp(');
  });

  it('allows customizing minItemWidth and element tag', () => {
    const { container } = render(
      <FluidGrid as="section" minItemWidth={350} gap={24}>
        <div>Section Child</div>
      </FluidGrid>
    );

    const section = container.firstElementChild as HTMLElement;
    expect(section.tagName.toLowerCase()).toBe('section');
    expect(section.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(100%, 350px), 1fr))'
    );
  });

  it('forwards ref and merges style/className', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <FluidGrid
        ref={ref}
        className="custom-grid"
        style={{ backgroundColor: 'rgb(255, 0, 0)' }}
      >
        <div>Child</div>
      </FluidGrid>
    );

    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current?.classList.contains('custom-grid')).toBe(true);
    expect(ref.current?.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(ref.current?.style.display).toBe('grid');
  });
});

describe('useLayoutGuard', () => {
  function TestGuardComponent({ enabled }: { enabled?: boolean }) {
    useLayoutGuard({ enabled, warnInConsole: false });
    return <div id="test-root">Guard active</div>;
  }

  afterEach(() => {
    act(() => {
      while (activeRoots.length > 0) {
        const item = activeRoots.pop();
        item?.root.unmount();
        item?.container.remove();
      }
    });
  });

  it('does nothing when disabled', () => {
    render(<TestGuardComponent enabled={false} />);
    expect(document.documentElement.hasAttribute('data-fluid-overflow')).toBe(false);
  });

  it('cleans up flags on unmount', () => {
    const { unmount } = render(<TestGuardComponent enabled={true} />);
    unmount();
    expect(document.documentElement.hasAttribute('data-fluid-overflow')).toBe(false);
  });
});
