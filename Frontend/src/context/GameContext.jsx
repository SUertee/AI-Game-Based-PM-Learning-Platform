import React, { createContext, useContext, useState } from "react";

const GameContext = createContext();

export function GameProvider({ children }) {
  const [gameId, setGameId] = useState(() => localStorage.getItem("gameId") || null);

  const saveGameId = (id) => {
    setGameId(id);
    localStorage.setItem("gameId", id);
  };

  return (
    <GameContext.Provider value={{ gameId, setGameId: saveGameId }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
