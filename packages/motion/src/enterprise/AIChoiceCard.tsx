/**
 * AIChoiceCard - Enterprise component for presenting AI-generated choices
 */

import type * as React from 'react';
import { useMotionContext } from '../react/MotionProvider.js';
import { useMotion } from '../react/useMotion.js';

interface AIChoice {
  id: string;
  label: string;
  confidence: number;
  reasoning?: string;
}

interface AIChoiceCardProps {
  options: AIChoice[];
  selectedId?: string;
  onSelect?: (choice: AIChoice) => void;
  motion?: string;
  className?: string;
}

export function AIChoiceCard({
  options,
  selectedId,
  onSelect,
  motion = '[presentation:confidence-wave] [selection:elastic-snap]',
  className,
}: AIChoiceCardProps): React.ReactElement {
  const context = useMotionContext();
  const disabled = context.reducedMotion;

  return (
    <div className={className} role="radiogroup" aria-label="AI suggestions">
      {options.map((option, index) => (
        <ChoiceOption
          key={option.id}
          option={option}
          index={index}
          isSelected={option.id === selectedId}
          onSelect={() => onSelect?.(option)}
          motion={motion}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface ChoiceOptionProps {
  option: AIChoice;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  motion: string;
  disabled: boolean;
}

function ChoiceOption({
  option,
  index,
  isSelected,
  onSelect,
  motion,
  disabled,
}: ChoiceOptionProps): React.ReactElement {
  // Stagger delay based on index (confidence-wave effect)
  const staggerDelay = index * 50;
  const confidencePercent = Math.round(option.confidence * 100);

  const motionConfig = disabled
    ? ''
    : `[material:glass] [onHover:glow:intensity=${0.3 + option.confidence * 0.4}] [onClick:elastic]`;

  const motionResult = useMotion({
    config: motionConfig,
    disabled,
  });

  return (
    <button
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        marginBottom: '8px',
        border: isSelected
          ? '2px solid var(--skeed-color-brand-500)'
          : '1px solid var(--skeed-color-neutral-200)',
        borderRadius: '8px',
        background: isSelected ? 'var(--skeed-color-brand-50)' : 'white',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        animation: disabled ? undefined : `fadeInUp 0.3s ease ${staggerDelay}ms both`,
        ...motionResult.style,
      }}
      {...motionResult.handlers}
    >
      {/* Confidence indicator */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `conic-gradient(
            var(--skeed-color-brand-500) 0% ${confidencePercent}%,
            var(--skeed-color-neutral-200) ${confidencePercent}% 100%
          )`,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'var(--skeed-color-neutral-700)',
          }}
        >
          {confidencePercent}%
        </div>
      </div>

      {/* Label and reasoning */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '500', color: 'var(--skeed-color-neutral-900)' }}>
          {option.label}
        </div>
        {option.reasoning && (
          <div
            style={{ fontSize: '14px', color: 'var(--skeed-color-neutral-500)', marginTop: '4px' }}
          >
            {option.reasoning}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--skeed-color-brand-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
