import { render, screen } from '@testing-library/react';
import { GlassCard } from '@/components/ui/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <h1>Test Content</h1>
        <p>Glass card content</p>
      </GlassCard>
    );
    
    expect(screen.getByRole('heading', { name: /test content/i })).toBeInTheDocument();
    expect(screen.getByText(/glass card content/i)).toBeInTheDocument();
  });

  it('applies default glass morphism styles', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('backdrop-blur-xl');
    expect(card).toHaveClass('bg-white/5');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('rounded-xl');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-glass-class">
        Content
      </GlassCard>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-glass-class');
    expect(card).toHaveClass('backdrop-blur-xl'); // Should still have default classes
  });

  it('forwards props to the underlying div', () => {
    render(
      <GlassCard data-testid="glass-card" role="region">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveAttribute('role', 'region');
  });
});