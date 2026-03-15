import React, { useRef, useEffect } from "react"

const SimpleComponent = ({ children }: { children?: React.ReactNode }) => {
  const previousChildren = useRef<React.ReactNode>(null);
  console.log('children', children);
  console.log('previousChildren', previousChildren.current);
  console.log('previousChildren.current === children', previousChildren.current === children)

  useEffect(() => {
    previousChildren.current = children;
    console.log('--- children', children);
    console.log('--- previousChildren', previousChildren.current);
    console.log('--- previousChildren.current === children', previousChildren.current === children)
  })

  return (
    <div>{ children }</div>
  )
}

export default SimpleComponent;