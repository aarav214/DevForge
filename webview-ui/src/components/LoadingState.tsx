import React from "react";

interface LoadingStateProps {
  message: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <div className="state-container">
      <div className="state-loading-spinner" />
      <div>{message}</div>
    </div>
  );
};
