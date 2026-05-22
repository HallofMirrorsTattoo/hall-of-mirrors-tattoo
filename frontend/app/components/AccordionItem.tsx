'use client';
import { useState } from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function AccordionItem({ title, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.75rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: open ? 'var(--gold)' : 'var(--cream)',
          transition: 'color 0.2s ease',
        }}>
          {title}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'normal',
            fontSize: '1.75rem',
            fontWeight: 300,
            color: 'rgba(201,168,76,0.7)',
            lineHeight: 1,
            flexShrink: 0,
            marginLeft: '1rem',
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.25s ease',
            display: 'inline-block',
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingBottom: '2rem' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
