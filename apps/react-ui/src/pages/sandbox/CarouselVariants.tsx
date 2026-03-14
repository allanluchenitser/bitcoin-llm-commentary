// Getting more solid on ReactJS by building some classic, non-trivial components.
// What better than some carousels.

import React, { useState } from 'react';
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
        className={clsx(s.stepButton, page === 0 ? s.disabled : '')}
      >
        <ChevronLeft />
      </div>
      <div className={s.viewPort} style={dynamicStyles}>
        {children}
      </div>
      <div
        onClick={nextPage}
        className={clsx(s.stepButton, numberOfChildren - visible ? s.disabled : '')}
      >
        <ChevronRight />
      </div>
    </div>
}

