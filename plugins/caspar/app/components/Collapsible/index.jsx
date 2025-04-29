import React from "react";
import { useCollapse } from "react-collapsed";

export const Collapsible = ({ isOpen, children }) => {
  const config = {
    duration: 200,
    isExpanded: isOpen,
  }
  
  const { getCollapseProps } = useCollapse(config);

  return (
    <div className="Collapsible">
      <div {...getCollapseProps()}>{children}</div>
    </div>
  )
}