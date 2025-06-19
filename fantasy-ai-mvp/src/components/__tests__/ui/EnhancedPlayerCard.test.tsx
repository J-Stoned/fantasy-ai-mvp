import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedPlayerCard } from '@/components/ui/EnhancedPlayerCard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockPlayer = {
  id: "test-player-1",
  name: "Josh Allen",
  position: "QB",
  team: "BUF",
  opponent: "MIA",
  projectedPoints: 24.7,
  lastWeekPoints: 28.3,
  seasonAverage: 22.1,
  injuryStatus: "Healthy",
  confidence: 0.91,
  trend: "up" as const,
  matchupRating: "excellent" as const,
  isStarter: true,
  ownership: 99.8
};

describe('EnhancedPlayerCard', () => {
  it('renders player information correctly', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('Josh Allen')).toBeInTheDocument();
    expect(screen.getByText('QB')).toBeInTheDocument();
    expect(screen.getByText('BUF vs MIA')).toBeInTheDocument();
    expect(screen.getByText('24.7')).toBeInTheDocument();
    expect(screen.getByText('91')).toBeInTheDocument(); // Confidence percentage
  });

  it('displays starter badge for starter players', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('STARTER')).toBeInTheDocument();
  });

  it('does not display starter badge for non-starter players', () => {
    const nonStarterPlayer = { ...mockPlayer, isStarter: false };
    render(<EnhancedPlayerCard player={nonStarterPlayer} />);
    
    expect(screen.queryByText('STARTER')).not.toBeInTheDocument();
  });

  it('shows correct position color for QB', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    const positionElement = screen.getByText('QB');
    expect(positionElement).toHaveClass('text-neon-blue');
  });

  it('displays confidence score with correct color coding', () => {
    // High confidence (>80%) should be green
    render(<EnhancedPlayerCard player={mockPlayer} />);
    const confidenceElement = screen.getByText('91');
    expect(confidenceElement).toHaveClass('text-neon-green');
  });

  it('shows medium confidence in yellow', () => {
    const mediumConfidencePlayer = { ...mockPlayer, confidence: 0.7 };
    render(<EnhancedPlayerCard player={mediumConfidencePlayer} />);
    
    const confidenceElement = screen.getByText('70');
    expect(confidenceElement).toHaveClass('text-neon-yellow');
  });

  it('shows low confidence in red', () => {
    const lowConfidencePlayer = { ...mockPlayer, confidence: 0.5 };
    render(<EnhancedPlayerCard player={lowConfidencePlayer} />);
    
    const confidenceElement = screen.getByText('50');
    expect(confidenceElement).toHaveClass('text-neon-red');
  });

  it('displays projected, last week, and season average stats', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('24.7')).toBeInTheDocument(); // Projected
    expect(screen.getByText('28.3')).toBeInTheDocument(); // Last week
    expect(screen.getByText('22.1')).toBeInTheDocument(); // Season average
    
    expect(screen.getByText('PROJ')).toBeInTheDocument();
    expect(screen.getByText('LAST')).toBeInTheDocument();
    expect(screen.getByText('AVG')).toBeInTheDocument();
  });

  it('shows trend indicator correctly', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('up')).toBeInTheDocument();
  });

  it('displays matchup rating with correct styling', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    const matchupElement = screen.getByText('excellent matchup');
    expect(matchupElement).toHaveClass('text-neon-green');
  });

  it('shows injury status correctly', () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('expands details when details button is clicked', async () => {
    render(<EnhancedPlayerCard player={mockPlayer} />);
    
    const detailsButton = screen.getByRole('button', { name: /details/i });
    fireEvent.click(detailsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Ceiling Projection:')).toBeInTheDocument();
      expect(screen.getByText('Floor Projection:')).toBeInTheDocument();
      expect(screen.getByText('Matchup Difficulty:')).toBeInTheDocument();
    });
  });

  it('shows ownership percentage in advanced mode', () => {
    render(<EnhancedPlayerCard player={mockPlayer} showAdvanced />);
    
    expect(screen.getByText('99.8% owned')).toBeInTheDocument();
  });

  it('shows additional stats in advanced mode when details expanded', async () => {
    render(<EnhancedPlayerCard player={mockPlayer} showAdvanced />);
    
    const detailsButton = screen.getByRole('button', { name: /details/i });
    fireEvent.click(detailsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Target Share:')).toBeInTheDocument();
      expect(screen.getByText('Red Zone Looks:')).toBeInTheDocument();
    });
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    render(<EnhancedPlayerCard player={mockPlayer} onClick={mockOnClick} />);
    
    const card = screen.getByText('Josh Allen').closest('div')?.parentElement;
    fireEvent.click(card!);
    
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('does not call onClick when details button is clicked', () => {
    const mockOnClick = jest.fn();
    render(<EnhancedPlayerCard player={mockPlayer} onClick={mockOnClick} />);
    
    const detailsButton = screen.getByRole('button', { name: /details/i });
    fireEvent.click(detailsButton);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('handles different position colors correctly', () => {
    const rbPlayer = { ...mockPlayer, position: 'RB' };
    render(<EnhancedPlayerCard player={rbPlayer} />);
    
    const positionElement = screen.getByText('RB');
    expect(positionElement).toHaveClass('text-neon-green');
  });

  it('handles injured player status', () => {
    const injuredPlayer = { ...mockPlayer, injuryStatus: 'Questionable' };
    render(<EnhancedPlayerCard player={injuredPlayer} />);
    
    expect(screen.getByText('Questionable')).toBeInTheDocument();
  });

  it('shows matchup difficulty colors correctly', () => {
    const difficultMatchupPlayer = { ...mockPlayer, matchupRating: 'difficult' as const };
    render(<EnhancedPlayerCard player={difficultMatchupPlayer} />);
    
    const matchupElement = screen.getByText('difficult matchup');
    expect(matchupElement).toHaveClass('text-neon-red');
  });

  it('handles down trend correctly', () => {
    const downTrendPlayer = { ...mockPlayer, trend: 'down' as const };
    render(<EnhancedPlayerCard player={downTrendPlayer} />);
    
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  it('handles stable trend correctly', () => {
    const stableTrendPlayer = { ...mockPlayer, trend: 'stable' as const };
    render(<EnhancedPlayerCard player={stableTrendPlayer} />);
    
    expect(screen.getByText('stable')).toBeInTheDocument();
  });
});