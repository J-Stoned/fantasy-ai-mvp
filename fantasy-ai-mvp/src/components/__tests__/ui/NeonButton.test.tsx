import { render, screen, fireEvent } from '@testing-library/react';
import { NeonButton } from '@/components/ui/NeonButton';

describe('NeonButton', () => {
  it('renders with default props', () => {
    render(<NeonButton>Test Button</NeonButton>);
    
    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-neon-blue/10'); // Default blue variant
  });

  it('renders with different variants', () => {
    const { rerender } = render(<NeonButton color="purple">Purple Button</NeonButton>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-neon-purple/10');

    rerender(<NeonButton color="green">Green Button</NeonButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-neon-green/10');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<NeonButton onClick={handleClick}>Clickable Button</NeonButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = jest.fn();
    render(
      <NeonButton disabled onClick={handleClick}>
        Disabled Button
      </NeonButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<NeonButton size="sm">Small Button</NeonButton>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<NeonButton size="lg">Large Button</NeonButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('applies custom className', () => {
    render(<NeonButton className="custom-class">Custom Button</NeonButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});