import React from 'react';

export function LinkedNode({
  to,
  ariaLabel,
  children,
}: {
  to?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return to ? <a href={to} aria-label={ariaLabel}>{children}</a> : <>{children}</>;
}