import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";

export default function Boards() {
  const [boards, setBoards] = useState([]);
  useEffect(() => {
    api.get("/board/").then(res => setBoards(res.data)).catch(() => setBoards([]));
  }, []);
  return (
    <div>
      <h1 className="text-2xl mb-4">Boards</h1>
      {boards.map(b => (
        <div key={b.id} className="border p-3 mb-3 rounded">
          <Link to={`/boards/${b.id}`} className="text-lg font-semibold">{b.name}</Link>
          <p className="text-sm">{b.description}</p>
        </div>
      ))}
    </div>
  );
}