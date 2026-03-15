// Let's build some classic, non-trivial components by hand.
  // What better than some carousels.

import React, { useState, useRef, useLayoutEffect } from 'react';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { type CSSPropertiesWithVars } from '@/types/customReactTypes';

import clsx from 'clsx';
import s from './CarouselVariants.module.scss';

type TradCarouselParams = {
  children: React.ReactNode,
  className?: string,
  visible?: number,
  width?: string
}

export const TradCarousel = (
  { children, visible = 3, width = '100%', className }:
  TradCarouselParams
) => {
  const [page, setPage] = useState(0);

  const numberOfChildren = React.Children.count(children);

  const nextPage = () => {
    if (page < numberOfChildren - visible) { setPage(prev => prev + 1); }
  };

  const prevPage = () => {
    if (page > 0) setPage(prev => prev - 1);
  }

  const dynamicStyles: CSSPropertiesWithVars = {
    '--visible': visible,
    '--page': page,
    '--port-width': width,
  }

  return (
    <div className={`${s.tradCarousel} ${className}`}>
      <div
        onClick={prevPage}
        className={clsx(
          s.stepButton,
          page === 0
            ? s.disabled
            : ''
        )}
      >
        <ChevronLeft />
      </div>
      <div className={s.viewPort} style={dynamicStyles}>
        {children}
      </div>
      <div
        onClick={nextPage}
        className={clsx(
          s.stepButton,
          page === numberOfChildren - visible
            ? s.disabled
            : ''
        )}
      >
        <ChevronRight />
      </div>
    </div>
  )
}

type VerticalColumnFeederParams = {
  className?: string,
  children?: React.ReactNode
}

export const VerticalColumnFeeder = ({ children, className }: VerticalColumnFeederParams) => {
  const firstRender = useRef(true);
  const viewPortRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if(firstRender.current) {
      firstRender.current = false;
      return;
    }
    const node = viewPortRef.current;
    if (!node) return;

    const childElements = Array.from(node.children) as HTMLElement[];
    let step = 0;

    if (childElements.length >= 2) {
      const firstRect = childElements[0].getBoundingClientRect();
      const secondRect = childElements[1].getBoundingClientRect();
      step = secondRect.top - firstRect.top;
    } else if (childElements.length === 1) {
      step = childElements[0].getBoundingClientRect().height;
    }

    node.style.setProperty('--offset-px', `${Math.max(step, 0) * -1}px`);

    node.classList.remove(s.animate);
    void node.offsetWidth;
    node.classList.add(s.animate);
  }, [children]);

  return (
    <div className={clsx(s.verticalColumnFeeder, className || '')}>
      <div
        ref={viewPortRef}
        className={s.viewPort}
      >
        { children }
      </div>
    </div>
  )
}

