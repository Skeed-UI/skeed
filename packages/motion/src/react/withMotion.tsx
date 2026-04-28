/**
 * withMotion HOC - wraps components with motion capabilities
 */

import type * as React from 'react';
import { forwardRef } from 'react';
import { useMotionContext } from './MotionProvider.js';
import type { WithMotionProps } from './types.js';
import { useMotion } from './useMotion.js';

type AnyProps = Record<string, unknown>;

/**
 * Higher-order component that adds motion props to any component
 */
export function withMotion<P extends AnyProps>(
  Component: React.ComponentType<P>,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P & WithMotionProps> & React.RefAttributes<unknown>
> {
  const MotionComponent = forwardRef<unknown, P & WithMotionProps>(
    function MotionWrapper(props, ref) {
      const { motion, motionDisabled, ...restProps } = props;
      const context = useMotionContext();

      // Disable if globally reduced motion or explicitly disabled
      const disabled = !!motionDisabled || context.reducedMotion;

      // Use motion hook if config provided
      const motionResult = useMotion({
        config: motion || '',
        disabled,
      });

      // Merge motion styles with any existing style prop
      const existingStyle = (restProps as AnyProps).style as React.CSSProperties | undefined;
      const style: React.CSSProperties = {
        ...(existingStyle || {}),
        ...motionResult.style,
      };

      // Merge motion handlers with any existing handlers
      const handlers = motionResult.handlers;

      const createHandler = (
        motionHandler: ((e: React.MouseEvent<HTMLElement>) => void) | undefined,
        existingHandler: unknown,
      ) => {
        return (e: React.MouseEvent<HTMLElement>) => {
          motionHandler?.(e);
          if (typeof existingHandler === 'function') {
            existingHandler(e);
          }
        };
      };

      const createFocusHandler = (
        motionHandler: ((e: React.FocusEvent<HTMLElement>) => void) | undefined,
        existingHandler: unknown,
      ) => {
        return (e: React.FocusEvent<HTMLElement>) => {
          motionHandler?.(e);
          if (typeof existingHandler === 'function') {
            existingHandler(e);
          }
        };
      };

      const mergedHandlers = {
        onMouseEnter: createHandler(handlers.onMouseEnter, (restProps as AnyProps).onMouseEnter),
        onMouseLeave: createHandler(handlers.onMouseLeave, (restProps as AnyProps).onMouseLeave),
        onMouseMove: createHandler(handlers.onMouseMove, (restProps as AnyProps).onMouseMove),
        onClick: createHandler(handlers.onClick, (restProps as AnyProps).onClick),
        onFocus: createFocusHandler(handlers.onFocus, (restProps as AnyProps).onFocus),
        onBlur: createFocusHandler(handlers.onBlur, (restProps as AnyProps).onBlur),
      };

      const componentProps = {
        ...restProps,
        ref,
        style,
        ...mergedHandlers,
      } as unknown as P;

      return <Component {...componentProps} />;
    },
  );

  return MotionComponent;
}
