// Getting more solid on ReactJS by building some classic, non-trivial components.
// What better than some carousels.

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { type CSSPropertiesWithVars } from '@/types/customReactTypes';
import s from './CarouselVariants.module.scss';

type TradCarouselParams = {
  children: React.ReactNode,
  className?: string,
  visible?: number,
}

export const TradCarousel = ({ children, visible = 3, className }: TradCarouselParams) => {
  const [page, setPage] = useState(0);

  const numberOfChildren = React.Children.count(children);

  const nextPage = () => {
    if (page < numberOfChildren - visible) { setPage(prev => prev + 1); }
  };

  const prevPage = () => {
    if (page > 0) setPage(prev => prev - 1);
  }

  return (
    <div className={`${s.tradCarousel} ${className}`}>
      <div className={s.stepButton}>
        <ChevronLeft onClick={prevPage} />
      </div>
      <div className={s.viewPort} style={{ '--visible': visible, '--page': page } as CSSPropertiesWithVars}>
        {children}
      </div>
      <div className={s.stepButton}>
        <ChevronRight onClick={nextPage} />
      </div>
    </div>
  )
}

