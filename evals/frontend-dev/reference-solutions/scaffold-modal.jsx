/**
 * Reference solution: Scaffolded Modal component.
 * This is the expected output quality for /frontend-dev:scaffold-component
 * when asked to create a Modal with focus trapping and Escape handling.
 */

// --- Modal.tsx ---

import React, { useEffect, useRef, useCallback } from 'react';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title for the heading and aria-label */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that had focus before opening
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus the dialog when it opens, restore focus when it closes
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstFocusable =
        dialogRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable || dialogRef.current).focus();
    }

    return () => {
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable =
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={className}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          zIndex: 41,
          maxWidth: '500px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="modal-title" style={{ margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </>
  );
};

Modal.displayName = 'Modal';

// --- Modal.test.tsx ---

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <p>Modal content</p>,
};

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has aria-modal and aria-labelledby', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    // Click backdrop (the element with aria-hidden)
    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) await user.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    await user.click(screen.getByLabelText('Close modal'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('traps focus within the modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal {...defaultProps}>
        <input data-testid="input-1" />
        <button>Action</button>
      </Modal>
    );
    // Tab through elements — focus should cycle within modal
    await user.tab();
    await user.tab();
    await user.tab();
    // Focus should still be inside the dialog
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
});
